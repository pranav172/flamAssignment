export type MessageHandler = (type: string, payload: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: MessageHandler[] = [];
    private url: string;
    
    constructor(url: string) {
        this.url = url;
    }

    public connect(onOpen?: () => void) {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('Connected to server');
            if (onOpen) onOpen();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.forEach(handler => handler(data.type, data.payload));
            } catch (e) {
                console.error('Failed to parse message', event.data);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected. Reconnecting in 3s...');
            setTimeout(() => this.connect(onOpen), 3000);
        };
    }

    public send(type: string, payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    public onMessage(handler: MessageHandler) {
        this.handlers.push(handler);
    }
}
