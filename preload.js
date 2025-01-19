const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Signaling
  sendSignalingMessage: (message) => {
      console.log('Preload: Sending signaling message', message);
      ipcRenderer.send('signaling-message', message);
  },
  onSignalingMessage: (callback) => {
      ipcRenderer.on('signaling-message', (event, message) => {
          console.log('Preload: Received signaling message', message);
          callback(message);
      });
  },

  // Invoke methods
  invoke: (channel, args) => ipcRenderer.invoke(channel, args),
});