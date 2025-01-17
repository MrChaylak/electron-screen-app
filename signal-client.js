const { io } = require("socket.io-client");

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
    peerConnection.addTransceiver('video', { direction: 'sendonly' });

    // Set up the data channel
    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      dataChannel.onopen = () => {
        console.log("Data channel opened!");

        // Pass the data channel to the camera script
        if (window.setDataChannel) {
          window.setDataChannel(dataChannel);
        }
      };
      dataChannel.onmessage = async (event) => {
        console.log("Message received:", event.data);
      
        try {
          const message = JSON.parse(event.data);
          if (message.type === "selectedCamera") {
            const { selectedDeviceId } = message;
            console.log("Received selected camera ID from Vue:", selectedDeviceId);
      
            await handleSelectedCamera(selectedDeviceId);
          }
        } catch (error) {
          console.error("Failed to parse or process data channel message:", error);
        }
      };
      
      async function handleSelectedCamera(selectedDeviceId) {
        try {
          console.log("Handling selected camera ID:", selectedDeviceId);
      
          // Get the video stream for the selected camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedDeviceId } },
          });
      
          console.log("MediaStream obtained:", stream);
      
          //can you RTCPeerConnection: addTrack() method
          stream.getTracks().forEach((track) => {
            console.log("Adding track to peer connection:", track,peerConnection);
            peerConnection.addTrack(track, stream);
            console.log("Track added:", track);
            console.log(stream.getTracks());
            console.log(stream.getVideoTracks());
          });

        } catch (error) {
          console.error("Error handling selected camera:", error);
        }
      }
      
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
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({
        type: offer.type, // Ensure the type is included
        sdp: offer.sdp, // Include the SDP
      })
    );

    // Create an answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("Answer created:", answer);

    // Send the answer to the server
    socket.emit("newAnswer", {
      type: answer.type, // Ensure the type is included
      sdp: answer.sdp, // Include the SDP
    });
  });

  socket.on("iceCandidate", (data) => {
    const { candidate, didIOffer } = data;
    if (didIOffer) {
      // Only add if the candidate is from the offerer
      console.log("Received ICE candidate from offerer:", candidate);
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  });
});