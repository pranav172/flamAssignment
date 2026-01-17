import { WebSocketClient } from './socket';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    id: string;
    userId: string;
    color: string;
    width: number;
    points: Point[];
    isFinished: boolean;
}

interface Cursor {
    userId: string;
    x: number;
    y: number;
    color: string;
    lastUpdate: number;
}

export class CanvasManager {
    private staticCanvas: HTMLCanvasElement;
    private activeCanvas: HTMLCanvasElement;
    private staticCtx: CanvasRenderingContext2D;
    private activeCtx: CanvasRenderingContext2D;
    private socket: WebSocketClient;

    private isDrawing = false;
    private currentStrokeId: string | null = null;
    private myColor = '#000000';
    private myWidth = 5;
    private myUserId: string = '';
    private isEraserMode = false;
    private savedColor = '#000000'; // Store color when switching to eraser

    private strokes: Map<string, Stroke> = new Map(); // All history
    private cursors: Map<string, Cursor> = new Map();
    
    // Remote users map for color/name lookup
    private users: Map<string, {name: string, color: string}> = new Map();

    // Virtual canvas dimensions - SCROLLABLE CANVAS (Reduced for better performance)
    private readonly VIRTUAL_WIDTH = 3000;
    private readonly VIRTUAL_HEIGHT = 3000;
    
    // Performance optimization flags
    private isDirty = false; // Track if active canvas needs redraw
    private lastPointBatchTime = 0;
    private pointBatchBuffer: Array<{strokeId: string, x: number, y: number}> = [];
    private readonly POINT_BATCH_INTERVAL = 16; // ~60fps max for point updates

    constructor(staticCanvas: HTMLCanvasElement, activeCanvas: HTMLCanvasElement, socket: WebSocketClient) {
        this.staticCanvas = staticCanvas;
        this.activeCanvas = activeCanvas;
        this.staticCtx = staticCanvas.getContext('2d')!;
        this.activeCtx = activeCanvas.getContext('2d')!;
        this.socket = socket;

        this.initializeCanvas();
        window.addEventListener('resize', () => this.initializeCanvas());

        this.setupInputHandlers();
        this.startAnimationLoop();
    }

    public setUserId(id: string) {
        this.myUserId = id;
    }

    public setColor(color: string) {
        this.myColor = color;
    }

    public setWidth(width: number) {
        this.myWidth = width;
    }

    public toggleEraser() {
        this.isEraserMode = !this.isEraserMode;
        if (this.isEraserMode) {
            // Save current color and switch to white (eraser)
            this.savedColor = this.myColor;
            this.myColor = '#FFFFFF';
        } else {
            // Restore saved color
            this.myColor = this.savedColor;
        }
    }

    public getEraserMode(): boolean {
        return this.isEraserMode;
    }

    private initializeCanvas() {
        // Set canvas to virtual dimensions for scrolling
        // Cap DPI at 2x for better performance on high-DPI displays
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        [this.staticCanvas, this.activeCanvas].forEach(canvas => {
            canvas.width = this.VIRTUAL_WIDTH * dpr;
            canvas.height = this.VIRTUAL_HEIGHT * dpr;
            canvas.style.width = `${this.VIRTUAL_WIDTH}px`;
            canvas.style.height = `${this.VIRTUAL_HEIGHT}px`;
            
            const ctx = canvas.getContext('2d')!;
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        });
        
        this.redrawStatic();
    }

    public setHistory(history: Stroke[]) {
        this.strokes.clear();
        history.forEach(s => this.strokes.set(s.id, s));
        this.redrawStatic();
    }

    public setUsers(users: {id: string, name: string, color: string}[]) {
        users.forEach(u => this.users.set(u.id, u));
    }

    public handleUserJoined(user: {id: string, name: string, color: string}) {
        this.users.set(user.id, user);
    }
    
    public handleUserLeft(userId: string) {
        this.users.delete(userId);
        this.cursors.delete(userId);
    }

    public handleDrawStart(payload: any) {
        // Remote user start
        const stroke: Stroke = {
            id: payload.id,
            userId: payload.userId,
            color: payload.color,
            width: payload.width,
            points: payload.points || [], 
            isFinished: false
        };
        this.strokes.set(stroke.id, stroke);
        this.isDirty = true;
    }

    public handleDrawPoint(payload: any) {
        const stroke = this.strokes.get(payload.strokeId);
        if (stroke) {
            stroke.points.push({ x: payload.x, y: payload.y });
            this.isDirty = true;
        }
    }

    public handleDrawEnd(payload: any) {
        const stroke = this.strokes.get(payload.strokeId);
        if (stroke && !stroke.isFinished) {
            stroke.isFinished = true;
            this.drawStroke(this.staticCtx, stroke); // Bake into static
        }
    }

    public handleUndo(payload: any) {
        if (this.strokes.has(payload.strokeId)) {
            this.strokes.delete(payload.strokeId);
            this.redrawStatic();
        }
    }

    public handleCursor(payload: any) {
        const user = this.users.get(payload.userId);
        if (user) {
            this.cursors.set(payload.userId, {
                userId: payload.userId,
                x: payload.x,
                y: payload.y,
                color: user.color,
                lastUpdate: Date.now()
            });
            this.isDirty = true;
        }
    }

    public clear() {
        this.strokes.clear();
        this.redrawStatic();
    }

    // --- Internal Logic ---

    private setupInputHandlers() {
        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = this.activeCanvas.getBoundingClientRect();
            let clientX, clientY;
            if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
                clientX = (e as TouchEvent).touches[0].clientX;
                clientY = (e as TouchEvent).touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            return { x, y };
        };

        const generateId = () => Math.random().toString(36).substr(2, 9);

        // Throttle cursor updates for performance
        let lastCursorUpdate = 0;
        const CURSOR_THROTTLE = 50; // ms

        const start = (e: MouseEvent | TouchEvent) => {
             // Only draw with left mouse button
             if (e instanceof MouseEvent && e.button !== 0) {
                 return;
             }
             
             const { x, y } = getPos(e);
             this.isDrawing = true;
             this.currentStrokeId = generateId();

             const stroke: Stroke = {
                 id: this.currentStrokeId,
                 userId: this.myUserId,
                 color: this.myColor,
                 width: this.myWidth,
                 points: [{x, y}],
                 isFinished: false
             };
             
             // Optimistic update
             this.strokes.set(stroke.id, stroke);

             this.socket.send('draw_start', {
                 id: stroke.id,
                 x, y,
                 color: this.myColor,
                 width: this.myWidth
             });
        };

        const move = (e: MouseEvent | TouchEvent) => {
            // Prevent scrolling while drawing
            if (this.isDrawing && e instanceof TouchEvent) {
                e.preventDefault();
            }

            const { x, y } = getPos(e);
            
            // Throttle cursor updates
            const now = Date.now();
            if (now - lastCursorUpdate > CURSOR_THROTTLE) {
                this.socket.send('cursor', { x, y });
                lastCursorUpdate = now;
            }

            if (this.isDrawing && this.currentStrokeId) {
                const stroke = this.strokes.get(this.currentStrokeId);
                if(stroke) {
                    stroke.points.push({x, y});
                    this.isDirty = true; // Mark for redraw
                    
                    // Batch point updates to reduce WebSocket traffic
                    this.pointBatchBuffer.push({
                        strokeId: this.currentStrokeId,
                        x, y
                    });
                    
                    // Send batch if enough time has passed
                    if (now - this.lastPointBatchTime > this.POINT_BATCH_INTERVAL) {
                        this.flushPointBatch();
                        this.lastPointBatchTime = now;
                    }
                }
            }
        };

        const end = () => {
            if (this.isDrawing && this.currentStrokeId) {
                this.isDrawing = false;
                
                // Flush any remaining batched points
                this.flushPointBatch();
                
                const stroke = this.strokes.get(this.currentStrokeId);
                if (stroke) {
                    stroke.isFinished = true;
                    this.drawStroke(this.staticCtx, stroke);
                    this.socket.send('draw_end', {
                        strokeId: this.currentStrokeId
                    });
                }
                this.currentStrokeId = null;
                this.isDirty = true;
            }
        };
        
        // Mouse events
        this.activeCanvas.addEventListener('mousedown', start);
        this.activeCanvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        
        // Touch events - allow browser to handle scroll detection
        this.activeCanvas.addEventListener('touchstart', start);
        this.activeCanvas.addEventListener('touchmove', (e) => {
            if (this.isDrawing) e.preventDefault();
            move(e);
        }, { passive: false });
        this.activeCanvas.addEventListener('touchend', end);
    }
    
    private flushPointBatch() {
        if (this.pointBatchBuffer.length > 0) {
            // Send all batched points in a single message
            this.pointBatchBuffer.forEach(point => {
                this.socket.send('draw_point', point);
            });
            this.pointBatchBuffer = [];
        }
    }
    

    private startAnimationLoop() {
        const render = () => {
            // Only redraw if something changed (dirty flag optimization)
            if (this.isDirty || this.hasActiveCursors() || this.hasActiveStrokes()) {
                // Clear Active Canvas
                this.activeCtx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);

                // Draw all unfinished strokes (Active Strokes)
                this.strokes.forEach(stroke => {
                    // Skip strokes with only 1 point to avoid showing initial dot
                    if (!stroke.isFinished && stroke.points.length >= 2) {
                        this.drawStroke(this.activeCtx, stroke);
                    }
                });

                // Draw Cursors
                this.cursors.forEach((cursor) => {
                    if (Date.now() - cursor.lastUpdate > 5000) return; // Hide old cursors
                    this.activeCtx.beginPath();
                    this.activeCtx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
                    this.activeCtx.fillStyle = cursor.color;
                    this.activeCtx.fill();
                });
                
                this.isDirty = false;
            }

            requestAnimationFrame(render);
        };
        render();
    }
    
    private hasActiveStrokes(): boolean {
        for (const stroke of this.strokes.values()) {
            if (!stroke.isFinished) return true;
        }
        return false;
    }
    
    private hasActiveCursors(): boolean {
        const now = Date.now();
        for (const cursor of this.cursors.values()) {
            if (now - cursor.lastUpdate <= 5000) return true;
        }
        return false;
    }

    private redrawStatic() {
        this.staticCtx.clearRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
        
        this.strokes.forEach(stroke => {
            if (stroke.isFinished) {
                this.drawStroke(this.staticCtx, stroke);
            }
        });
    }

    private drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
        if (stroke.points.length === 0) return;

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const points = stroke.points;
        
        if (points.length === 1) {
            // Single point - draw a dot
            ctx.beginPath();
            ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = stroke.color;
            ctx.fill();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        if (points.length === 2) {
            // Just two points - draw straight line
            ctx.lineTo(points[1].x, points[1].y);
        } else {
            // Smooth curve through all points
            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            // Draw the last segment to the final point
            ctx.quadraticCurveTo(
                points[points.length - 1].x,
                points[points.length - 1].y,
                points[points.length - 1].x,
                points[points.length - 1].y
            );
        }

        ctx.stroke();
    }
}
