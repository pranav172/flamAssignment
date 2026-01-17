import { WebSocket } from 'ws';
import { DrawingState } from './state';
import { v4 as uuidv4 } from 'uuid';

export interface User {
    id: string;
    name: string;
    color: string;
    ws: WebSocket;
}

export class Room {
    public id: string;
    public users: Map<string, User> = new Map();
    public state: DrawingState;

    constructor(id: string) {
        this.id = id;
        this.state = new DrawingState();
    }

    public addUser(user: User): void {
        this.users.set(user.id, user);
        this.broadcast({
            type: 'user_joined',
            payload: { userId: user.id, name: user.name, color: user.color }
        }, user.id);
    }

    public removeUser(userId: string): void {
        const user = this.users.get(userId);
        if (user) {
            this.users.delete(userId);
            this.broadcast({
                type: 'user_left',
                payload: { userId }
            });
        }
    }

    public broadcast(message: any, excludeUserId?: string) {
        const json = JSON.stringify(message);
        this.users.forEach((user) => {
            if (user.id !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(json);
            }
        });
    }

    public handleDrawStart(userId: string, data: any) {
        const { x, y, color, width, id } = data;
        const stroke = this.state.addStroke(userId, color, width, { x, y }, id);
        this.broadcast({
            type: 'draw_start',
            payload: { ...stroke }
        }, userId); // Broadcast to others so they can start drawing
        return stroke.id;
    }

    public handleDrawPoint(userId: string, data: any) {
        const { strokeId, x, y } = data;
        this.state.addPointToStroke(strokeId, { x, y });
        this.broadcast({
            type: 'draw_point',
            payload: { userId, strokeId, x, y }
        }, userId);
    }

    public handleDrawEnd(userId: string, data: any) {
        const { strokeId } = data;
        this.state.finishStroke(strokeId);
        this.broadcast({
            type: 'draw_end',
            payload: { userId, strokeId }
        }, userId);
    }

    public handleUndo(userId: string) {
        const undoneStrokeId = this.state.undo();
        if (undoneStrokeId) {
            // We need to tell clients to remove this stroke
            // Since our system is simple, we might just say "history_change" 
            // but explicitly saying "undo" with the ID allows smart clients to just remove one.
            this.broadcast({
                type: 'undo',
                payload: { strokeId: undoneStrokeId } // Broadcast to ALL, including sender
            });
        }
    }

    public handleClear(userId: string) {
        this.state.clear();
        this.broadcast({
            type: 'clear',
            payload: {}
        });
    }
}

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    constructor() {
        // Create a default room for easy testing
        this.createRoom('default');
    }

    public createRoom(id: string): Room {
        const room = new Room(id);
        this.rooms.set(id, room);
        return room;
    }

    public getRoom(id: string): Room | undefined {
        return this.rooms.get(id);
    }
}
