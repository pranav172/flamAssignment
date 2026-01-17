import { v4 as uuidv4 } from 'uuid';

export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    id: string;
    userId: string;
    color: string;
    width: number;
    points: Point[];
    startTime: number;
    isFinished: boolean;
}

export class DrawingState {
    // We treat 'strokes' as the history. 
    // New strokes are pushed to the end. 
    // Undo removes the last stroke.
    // Redo could be implemented if we keep a 'redoStack', 
    // but for 'real-time multi-user', Redo is tricky (what if someone else drew in between?).
    // We will stick to simple Global Undo (LIFO) for now as it's the core requirement.
    
    private strokes: Stroke[] = [];
    private redoStack: Stroke[] = []; // Optional: For simple redo cases
    
    constructor() {}

    public addStroke(userId: string, color: string, width: number, startPoint: Point, id?: string): Stroke {
        const stroke: Stroke = {
            id: id || uuidv4(),
            userId,
            color,
            width,
            points: [startPoint],
            startTime: Date.now(),
            isFinished: false
        };
        this.strokes.push(stroke);
        // Clearing redo stack on new action is standard behavior
        this.redoStack = []; 
        return stroke;
    }

    public addPointToStroke(strokeId: string, point: Point): void {
        const stroke = this.strokes.find(s => s.id === strokeId);
        if (stroke && !stroke.isFinished) {
            stroke.points.push(point);
        }
    }

    public finishStroke(strokeId: string): void {
        const stroke = this.strokes.find(s => s.id === strokeId);
        if (stroke) {
            stroke.isFinished = true;
        }
    }

    public undo(): string | null {
        // Global Undo: removes the very last stroke regardless of who drew it
        const stroke = this.strokes.pop();
        if (stroke) {
            this.redoStack.push(stroke);
            return stroke.id;
        }
        return null;
    }

    public clear(): void {
        this.strokes = [];
        this.redoStack = [];
    }

    public getHistory(): Stroke[] {
        return this.strokes;
    }
}
