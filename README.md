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
