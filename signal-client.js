const { io } = require("socket.io-client");
const { RTCPeerConnection, RTCSessionDescription } = require("wrtc");

document.addEventListener("DOMContentLoaded", () => {
  const socket = io("http://localhost:8181", {
    auth: {
      userName: "electron",
      password: "x",
    },
  });

  let peerConnection;
  let dataChannel;

  socket.on("newOfferAwaiting", async (offer) => {
    console.log("New offer received:", offer);
  
    // Create a new RTCPeerConnection
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  
    // Set up the data channel
    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      dataChannel.onopen = () => {
        console.log("Data channel opened!");
        dataChannel.send("Hello from Electron!");
      };
      dataChannel.onmessage = (event) => {
        console.log("Message received:", event.data);
      };
    };
  
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.emit("iceCandidate", {
          candidate: event.candidate,
          userName: "electron",
          didIOffer: false, // Indicates this candidate is from the answerer
        });
      }
    };
  
    // Ensure the offer object is properly formatted
    const remoteDescription = new RTCSessionDescription({
      type: offer.type, // Ensure the type is included
      sdp: offer.sdp,   // Include the SDP
    });
  
    // Set the remote description (offer)
    await peerConnection.setRemoteDescription(remoteDescription);
  
    // Create an answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("Answer created:", answer);
  
    // Send the answer to the server
    socket.emit("newAnswer", {
      type: answer.type, // Ensure the type is included
      sdp: answer.sdp,   // Include the SDP
    });
  });

  socket.on("iceCandidate", (data) => {
    const { candidate, didIOffer } = data;
    if (didIOffer) { // Only add if the candidate is from the offerer
      console.log("Received ICE candidate from offerer:", candidate);
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  });
});