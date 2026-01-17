import { CanvasManager } from './canvas';
import { WebSocketClient } from './socket';

// Initialize
const socket = new WebSocketClient('wss://collaborative-canvas-server-qvhy.onrender.com');
const staticCanvas = document.getElementById('staticCanvas') as HTMLCanvasElement;
const activeCanvas = document.getElementById('activeCanvas') as HTMLCanvasElement;

const canvasManager = new CanvasManager(staticCanvas, activeCanvas, socket);

// Connect
socket.connect(() => {
    // Initial join usually handled by connection or implicit
});

// UI Controls
const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
const sizePicker = document.getElementById('sizePicker') as HTMLInputElement;
const eraserBtn = document.getElementById('eraserBtn') as HTMLButtonElement;
const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const userCount = document.getElementById('userCount') as HTMLSpanElement;

colorPicker.addEventListener('change', (e) => {
    const color = (e.target as HTMLInputElement).value;
    canvasManager.setColor(color);
    // If in eraser mode, exit it when user picks a color
    if (canvasManager.getEraserMode()) {
        canvasManager.toggleEraser();
        eraserBtn.textContent = '✏️ Pen';
    }
});

sizePicker.addEventListener('input', (e) => {
    canvasManager.setWidth(parseInt((e.target as HTMLInputElement).value));
});

eraserBtn.addEventListener('click', () => {
    canvasManager.toggleEraser();
    eraserBtn.textContent = canvasManager.getEraserMode() ? '🧹 Eraser' : '✏️ Pen';
});

undoBtn.addEventListener('click', () => {
    socket.send('undo', {});
});

clearBtn.addEventListener('click', () => {
    socket.send('clear', {});
});

// Socket Events
socket.onMessage((type, payload) => {
    switch (type) {
        case 'welcome':
            canvasManager.setUserId(payload.userId);
            canvasManager.setColor(payload.color); 
            colorPicker.value = payload.color; // Sync UI
            canvasManager.setHistory(payload.history);
            canvasManager.setUsers(payload.users);
            // Server sends users array which already includes current user
            userCount.innerText = String(payload.users.length);
            break;
            
        case 'user_joined':
            canvasManager.handleUserJoined(payload);
            // Update count
            userCount.innerText = String(parseInt(userCount.innerText) + 1);
            break;
            
        case 'user_left':
            canvasManager.handleUserLeft(payload.userId);
             userCount.innerText = String(parseInt(userCount.innerText) - 1);
            break;
            
        case 'draw_start':
            canvasManager.handleDrawStart(payload);
            break;
            
        case 'draw_point':
            canvasManager.handleDrawPoint(payload);
            break;
            
        case 'draw_end':
            canvasManager.handleDrawEnd(payload);
            break;
            
        case 'undo':
            canvasManager.handleUndo(payload);
            break;

        case 'clear':
            canvasManager.clear();
            break;

        case 'cursor':
            canvasManager.handleCursor(payload);
            break;
    }
});
