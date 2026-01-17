import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager, User } from './rooms';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(cors());

// Health check
app.get('/', (req, res) => {
    res.send('Collaborative Canvas Server Running');
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

wss.on('connection', (ws: WebSocket, req) => {
    // Parse query params for room and user info usually, 
    // but we will wait for a 'join' message for simplicity or parsed from url.
    // Let's assume URL: ws://localhost:3000?room=default&name=User
    
    const url = new URL(req.url || '', 'http://localhost');
    const roomId = url.searchParams.get('room') || 'default';
    const userName = url.searchParams.get('name') || 'Anonymous';
    
    // Auto-create room if not exists (or fail, but auto-create is friendlier)
    let room = roomManager.getRoom(roomId);
    if (!room) {
        room = roomManager.createRoom(roomId);
    }

    const userId = uuidv4();
    // Assign a random color
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);

    const user: User = {
        id: userId,
        name: userName,
        color,
        ws
    };

    room.addUser(user);

    // Send Welcome Message with full history
    ws.send(JSON.stringify({
        type: 'welcome',
        payload: {
            userId: user.id,
            color: user.color,
            history: room.state.getHistory(),
            users: Array.from(room.users.values()).map(u => ({ id: u.id, name: u.name, color: u.color }))
        }
    }));

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message);
            const type = data.type;
            const payload = data.payload;

            switch (type) {
                case 'draw_start':
                    room?.handleDrawStart(userId, payload);
                    break;
                case 'draw_point':
                    room?.handleDrawPoint(userId, payload);
                    break;
                case 'draw_end':
                    room?.handleDrawEnd(userId, payload);
                    break;
                case 'undo':
                    room?.handleUndo(userId);
                    break;
                case 'clear':
                    room?.handleClear(userId);
                    break;
                case 'cursor':
                    room?.broadcast({
                        type: 'cursor',
                        payload: { userId, x: payload.x, y: payload.y }
                    }, userId);
                    break;
            }
        } catch (e) {
            console.error('Invalid message:', message);
        }
    });

    ws.on('close', () => {
        room?.removeUser(userId);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
