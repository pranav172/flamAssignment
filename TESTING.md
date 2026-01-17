# Testing Instructions

## To properly test the Clear button:

### 1. **Restart the Server**
Open a terminal and run:
```bash
cd collaborative-canvas/server
npm start
```

### 2. **Restart the Client** 
Open another terminal and run:
```bash
cd collaborative-canvas/client
npm run dev
```

### 3. **Hard Refresh Browser**
- Windows/Linux: Press **Ctrl + Shift + R** or **Ctrl + F5**
- Mac: Press **Cmd + Shift + R**

This clears the browser cache and loads the new JavaScript files.

### 4. **Test Clear Button**
1. Draw some shapes
2. Click the "Clear" button
3. The canvas should clear immediately

## If it still doesn't work:

Open your browser's Developer Console (F12) and:
1. Click the Clear button
2. Look for any error messages in the Console tab
3. Check the Network tab to see if the WebSocket message is being sent

The clear message should look like:
```json
{
  "type": "clear",
  "payload": {}
}
```
