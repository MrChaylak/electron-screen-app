const { io } = require("socket.io-client");

document.addEventListener("DOMContentLoaded", () => {
    // Connect to the signaling server
    const socket = io("http://localhost:8181", {
        auth: {
            userName: "electron",
            password: "x", // Make sure this matches the server's requirement
        },
    });

    // Log connection status
    socket.on("connect", () => {
        console.log("Connected to server with ID:", socket.id);
    });

    // Log messages received from the server
    socket.on("message", (data) => {
        console.log("Received message from server:", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Disconnected from server");
    });
});
