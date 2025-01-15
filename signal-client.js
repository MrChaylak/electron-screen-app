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
    console.log("Electron connected to server with ID:", socket.id);
  });

  // Handle new offers
  socket.on("newOfferAwaiting", (offers) => {
    console.log("New offer(s) received:", offers);

    // Assume the first offer in the list
    const offerObj = offers[0];
    if (!offerObj) return;

    // Create an answer
    const answer = {
      sdp: "sample-sdp-answer-from-electron", // Replace with a mock SDP
      type: "answer",
    };

    // Add the answer to the offer object
    offerObj.answer = answer;

    // Send the answer back to the server
    socket.emit("newAnswer", offerObj, (ack) => {
      console.log("Acknowledgment from server for ICE candidates:", ack);
    });

    console.log("Answer sent to server:", answer);
  });
});
