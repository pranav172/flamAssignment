# 🎨 Collaborative Canvas

A real-time collaborative drawing application built with TypeScript, WebSocket, and HTML5 Canvas. Draw together with multiple users in real-time!

## ✨ Features

### Drawing Tools
- **Pen Tool** - Draw with any color
- **Eraser Tool** - Toggle between pen and eraser mode
- **Adjustable Brush Size** - 1-20px brush width
- **Color Picker** - Choose any color for drawing

### Collaborative Features
- **Real-time Sync** - See other users' drawings instantly
- **Live Cursors** - View other users' cursor positions
- **User Count** - See how many people are online
- **History Sync** - New users see existing drawings

### Canvas Features
- **Large Drawing Area** - 5000x5000px scrollable canvas
- **Undo** - Remove your last stroke
- **Clear** - Clear the entire canvas for everyone

### Performance
- **Optimized Touch** - Smooth drawing on mobile devices
- **Throttled Updates** - Efficient cursor position syncing
- **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/pranav172/flamAssignment.git
cd flamAssignment/collaborative-canvas
```

2. **Install dependencies**

Server:
```bash
cd server
npm install
```

Client:
```bash
cd client
npm install
```

### Running the Application

1. **Start the WebSocket server**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3000`

2. **Start the client** (in a new terminal)
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

3. **Open in browser**
- Navigate to `http://localhost:5173`
- Open multiple tabs/windows to test collaboration!

## 🎮 How to Use

### Desktop
- **Draw**: Click and drag
- **Scroll**: Mouse wheel or scrollbars to navigate canvas
- **Erase**: Click eraser button (✏️ Pen / 🧹 Eraser)
- **Change Color**: Use color picker
- **Adjust Size**: Use brush size slider
- **Undo**: Remove your last stroke
- **Clear**: Clear entire canvas

### Mobile/Touch Devices
- **Draw**: Touch and drag
- **Scroll**: Swipe to navigate (when not drawing)
- **Erase**: Tap eraser button to toggle
- All other features work the same!

## 🏗️ Project Structure

```
collaborative-canvas/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── canvas.ts      # Canvas manager and drawing logic
│   │   ├── socket.ts      # WebSocket client
│   │   ├── main.ts        # Application entry point
│   │   └── style.css      # Styles
│   ├── index.html
│   └── package.json
│
├── server/                 # Backend WebSocket server
│   ├── src/
│   │   ├── server.ts      # WebSocket server and room management
│   │   └── index.ts       # Server entry point
│   └── package.json
│
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **TypeScript** - Type-safe JavaScript
- **HTML5 Canvas** - Drawing surface
- **WebSocket** - Real-time communication
- **Vite** - Fast build tool

### Backend
- **Node.js** - Runtime environment
- **ws** - WebSocket library
- **TypeScript** - Type-safe server code

---

## 🔌 How It Works

### Architecture Overview

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Client A  │ ←────────────────────────→ │             │
├─────────────┤                             │   Server    │
│   Client B  │ ←────────────────────────→ │  (Room      │
├─────────────┤                             │   Manager)  │
│   Client C  │ ←────────────────────────→ │             │
└─────────────┘                             └─────────────┘
```

### Real-time Synchronization

**1. Connection Flow**
- Client connects to WebSocket server
- Server assigns unique user ID and random color
- Client receives full drawing history and list of connected users
- User joins the shared drawing room

**2. Drawing Events**

When a user draws, the following happens:

```
Client Side:
1. User touches/clicks canvas → Capture coordinates
2. Create stroke locally (optimistic update)
3. Send event to server via WebSocket
4. Render stroke immediately on local canvas

Server Side:
1. Receive drawing event from client
2. Add to room's stroke history
3. Broadcast to all other connected clients
4. Each client updates their canvas

Other Clients:
1. Receive broadcasted event
2. Update their stroke map
3. Render the new stroke on their canvas
```

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `draw_start` | `{id, x, y, color, width}` | Start a new stroke |
| `draw_point` | `{strokeId, x, y}` | Add point to active stroke |
| `draw_end` | `{strokeId}` | Finish the stroke |
| `cursor` | `{x, y}` | Update cursor position |
| `undo` | `{}` | Remove last stroke |
| `clear` | `{}` | Clear entire canvas |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `welcome` | `{userId, color, history, users}` | Initial connection data |
| `user_joined` | `{id, name, color}` | New user connected |
| `user_left` | `{userId}` | User disconnected |
| `draw_start` | `{id, userId, color, width, points}` | Someone started drawing |
| `draw_point` | `{strokeId, x, y}` | New point in stroke |
| `draw_end` | `{strokeId}` | Stroke completed |
| `cursor` | `{userId, x, y}` | Cursor position update |
| `undo` | `{strokeId}` | Stroke removed |
| `clear` | `{}` | Canvas cleared |

### Backend Implementation

**Server Structure:**
```typescript
// Room-based architecture
Room {
  users: Map<userId, User>
  strokes: Map<strokeId, Stroke>
  
  addUser(user)
  removeUser(userId)
  addStroke(stroke)
  removeStroke(strokeId)
  broadcast(event, data)
}

// Each stroke contains:
Stroke {
  id: string           // Unique identifier
  userId: string       // Who drew it
  color: string        // Drawing color
  width: number        // Brush width
  points: Point[]      // Array of {x, y} coordinates
  isFinished: boolean  // Completion status
}
```

**Synchronization Strategy:**

1. **Optimistic Updates**
   - Client renders strokes immediately
   - No waiting for server confirmation
   - Provides instant feedback

2. **State Consistency**
   - Server is source of truth
   - All drawing history stored on server
   - New users get full history on join

3. **Broadcast Mechanism**
   - Server receives event from one client
   - Validates and stores in room state
   - Broadcasts to all OTHER clients (excludes sender)
   - Prevents duplicate rendering

4. **Cursor Throttling**
   - Cursor updates throttled to 50ms
   - Reduces network overhead
   - Still feels real-time to users

### Canvas Rendering

**Two-layer approach:**

```typescript
Static Canvas:  // Finished strokes (bottom layer)
Active Canvas:  // In-progress strokes + cursors (top layer)
```

**Why two layers?**
- Performance: Only redraw active elements during drawing
- Efficiency: Finished strokes baked into static layer once
- Smooth: No flickering during active drawing

### Touch Optimization

```typescript
Touch Events:
1. touchstart → Begin drawing (no preventDefault to allow scroll detection)
2. touchmove  → Continue drawing (preventDefault ONLY while drawing)
3. touchend   → Finish stroke

Smart Behavior:
- Tap and drag = Draw
- Swipe = Scroll (when not drawing)
- While drawing = Prevent scroll
```

### Eraser Implementation

```typescript
// Eraser is actually white pen
When eraser mode activated:
1. Save current color
2. Switch to white (#FFFFFF)
3. Draw normally (appears to erase on white background)
4. On exit: Restore original color

// Collaborative: Eraser strokes sync like regular strokes
```

---

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Responsive toolbar that stacks on small screens
- Optimized touch event handling
- Smooth drawing on touchscreens

## 🔧 Development

### Server Development
```bash
cd server
npm run dev  # Starts with nodemon for auto-reload
```

### Client Development
```bash
cd client
npm run dev  # Starts Vite dev server
```

### Building for Production

Client:
```bash
cd client
npm run build
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Pranav**
- GitHub: [@pranav172](https://github.com/pranav172)

## 🙏 Acknowledgments

Built as part of a coding assignment to demonstrate:
- Real-time collaboration
- WebSocket communication
- Canvas API manipulation
- Responsive web design
- TypeScript development

---

**Enjoy drawing together! 🎨**
