import SignalClient from "./signal-client.js";

document.addEventListener("DOMContentLoaded", () => {
  const client = new SignalClient();

  client.mounted(); // Initialize the WebSocket connection

  document.getElementById("send-message").addEventListener("click", () => {
    client.methods.sendMessage("App1", "Hello from Electron App!");
  });
});
