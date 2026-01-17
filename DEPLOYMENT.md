# Deployment Guide

## Client Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click "Deploy"

### Option 2: Deploy via CLI

```bash
npm i -g vercel
cd collaborative-canvas
vercel
```

## Server Deployment

**Important:** Vercel doesn't support WebSocket servers. Deploy the server separately on one of these platforms:

### Recommended: Render.com (Free Tier Available)

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** `collaborative-canvas-server` (or your choice)
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Click "Create Web Service"
6. Wait for deployment (2-3 minutes)
7. Copy your deployment URL (e.g., `https://your-app.onrender.com`)

### Alternative: Railway.app

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set root directory to `server`
5. Railway auto-detects and deploys

### Alternative: Heroku

```bash
# From server directory
heroku login
heroku create your-app-name
git subtree push --prefix server heroku main
```

## Update Client WebSocket URL

After deploying the server, update the WebSocket URL in your client:

**File:** `client/src/socket.ts`

```typescript
// Change from:
const socket = new WebSocketClient('ws://localhost:3000');

// To your deployed server URL:
const socket = new WebSocketClient('wss://your-server.onrender.com');
// or 'wss://your-server.up.railway.app'
```

## Complete Deployment Checklist

- [ ] Deploy server to Render/Railway/Heroku
- [ ] Get server WebSocket URL
- [ ] Update `client/src/socket.ts` with production URL
- [ ] Commit and push changes
- [ ] Deploy client to Vercel
- [ ] Test the application

## Environment Variables (if needed)

If you add environment variables later:

**Vercel (Client):**
- Add in Vercel Dashboard → Settings → Environment Variables

**Render/Railway (Server):**
- Add in their respective dashboards

## Notes

- Client uses `wss://` (secure WebSocket) in production
- Server needs to support SSL for `wss://`
- Most platforms (Render, Railway) provide SSL automatically
