const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('get-sources', async () => {
    return await desktopCapturer.getSources({
        types: ['screen', 'window'], // Include both screen and window options
        thumbnailSize: { width: 300, height: 200 }, // Adjust thumbnail size for better visibility
    });
});

