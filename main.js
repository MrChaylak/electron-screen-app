// main.js
const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const robot = require('@jitsi/robotjs');

let mainWindow;

// Create the main Electron window
function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Initialize signaling server connection
let signalingServer;

function connectToSignalingServer() {
    signalingServer = new WebSocket('ws://localhost:8080');

    signalingServer.onopen = () => {
        console.log('Connected to signaling server');
    };

    signalingServer.onmessage = (message) => {
        const messageString = Buffer.from(message.data).toString('utf-8');
        const data = JSON.parse(messageString);
        console.log('Received signaling message:', data);

        // Forward the message to the renderer process
        mainWindow.webContents.send('signaling-message', data);
    };

    signalingServer.onclose = () => {
        console.log('Disconnected from signaling server, retrying in 5 seconds...');
        setTimeout(connectToSignalingServer, 5000);
    };

    signalingServer.onerror = (error) => {
        console.error('Signaling server error:', error);
        signalingServer.close();
    };
}

connectToSignalingServer();

// Forward signaling messages from renderer to signaling server
ipcMain.on('signaling-message', (event, message) => {
    if (signalingServer && signalingServer.readyState === WebSocket.OPEN) {
        if (message.type === 'ice-candidate' && message.candidate) {
            console.log('Main: Forwarding ICE candidate:', message.candidate);
        }
        if (message.type === 'answer' && message.sdp) {
            console.log('Main: Forwarding answer:', message.sdp);
        }
        if (message.type === 'offer' && message.sdp) {
            console.log('Main: Forwarding offer:', message.sdp);
        }
        if (message.type === 'get-cameras') {
            console.log('Main: Forwarding get-cameras');
        }
        signalingServer.send(JSON.stringify(message));
    } else {
        console.error('Main: Signaling server is not connected');
    }
});


// Handle IPC messages for robotjs (remote control)
ipcMain.on('mouse-move', (event, data) => {
    const { x, y } = data;
    robot.moveMouse(x, y);
});

ipcMain.on('mouse-click', (event, data) => {
    const { button = 'left' } = data;
    robot.mouseClick(button);
});


ipcMain.on('mouse-scroll', (event, data) => {
    const { x, y } = data;
    robot.scrollMouse(x, y);
});

// Handle 'get-sources' request from renderer process
ipcMain.handle('get-sources', async () => {
    return await desktopCapturer.getSources({ types: ['screen', 'window'] });
});

ipcMain.on('key-press', (event, data) => {
    const { key , modifiers } = data;

    if (modifiers && modifiers.length > 0) {
        robot.keyTap(key, modifiers);
    }
    if (key === 'Backspace') robot.keyTap('backspace');
    else if (key === 'Enter') robot.keyTap('enter');
    else if (key === 'Escape') robot.keyTap('escape');
    else if (key === 'ArrowUp') robot.keyTap('up');
    else if (key === 'ArrowDown') robot.keyTap('down');
    else if (key === 'ArrowLeft') robot.keyTap('left');
    else if (key === 'ArrowRight') robot.keyTap('right');
    else if (key === 'Tab') robot.keyTap('tab');
    else if (key === 'Shift') robot.keyTap('shift');
    else if (key === 'Control') robot.keyTap('control');
    else if (key === 'Alt') robot.keyTap('alt');
    else if (key in ['ü', 'ğ', 'ş', 'ı', 'ö', 'ç']) robot.keyTap(key, 'turkish');
    else robot.keyTap(key);

});
