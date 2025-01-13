document.addEventListener("DOMContentLoaded", () => {
    const connectionStatus = document.getElementById("connection-status");
    const targetClientInput = document.getElementById("target-client");
    const messageContentInput = document.getElementById("message-content");
    const sendMessageButton = document.getElementById("send-message");
    const messagesDiv = document.getElementById("messages");

    // Update client list
    window.socketAPI.onClientListUpdate((clients) => {
        connectionStatus.textContent = `Connected clients: ${clients.join(", ")}`;
    });

    // Handle incoming signaling messages
    window.socketAPI.onSignalingMessage((data) => {
        const message = document.createElement("p");
        message.textContent = `Message from ${data.from}: ${data.message}`;
        messagesDiv.appendChild(message);
    });

    // Send a signaling message
    sendMessageButton.addEventListener("click", () => {
        const target = targetClientInput.value;
        const message = messageContentInput.value;

        if (!target || !message) {
            alert("Please specify a target client and message.");
            return;
        }

        window.socketAPI.sendSignal(target, message);
        messageContentInput.value = "";
    });
});
