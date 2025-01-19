(async function() {
  let peerConnections = {};
  let localStreams = {};

  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  function initPeerConnection(id) {
      const peerConnection = new RTCPeerConnection(configuration);

      const isInitiator = id === 'camera' || id === 'screen';
      if (isInitiator) {
          const dataChannel = peerConnection.createDataChannel('remote-control');
          dataChannel.onopen = () => {
              console.log(`Data channel opened for ${id}`);
          };
          dataChannel.onmessage = (event) => {
              console.log(`Received data channel message on ${id}:`, event.data);
              handleDataChannelMessage(event.data);
          };
          peerConnection.dataChannel = dataChannel;
      }

      peerConnection.onicecandidate = ({ candidate }) => {
          if (candidate) {
              console.log(`Sending ICE candidate from renderer to main for ${id}:`, candidate);
              const candidateObject = {
                  candidate: candidate.candidate,
                  sdpMLineIndex: candidate.sdpMLineIndex,
                  sdpMid: candidate.sdpMid,
                  usernameFragment: candidate.usernameFragment,
              };
              window.electronAPI.sendSignalingMessage({ type: 'ice-candidate', id, candidate: candidateObject });
          }
      };

      peerConnection.onconnectionstatechange = () => {
          console.log(`Peer connection state for ${id}:`, peerConnection.connectionState);
      };

      // Store the peer connection in the peerConnections object
      peerConnections[id] = peerConnection;
  }

  async function getCameraList() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput').map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId}`,
      }));
      window.electronAPI.sendSignalingMessage({ type: 'camera-list', cameras });
  }

  async function getScreenList() {
      const sources = await window.electronAPI.invoke('get-sources');
      const screens = sources.map(source => ({
          id: source.id,
          name: source.name,
      }));
      window.electronAPI.sendSignalingMessage({ type: 'screen-list', screens });
  }

  async function startCamera(deviceId) {
      const id = 'camera'; // Unique identifier for the camera stream
      try {

          //if already using camera, stop it
          if (localStreams[id]) {
              console.log('Stopping current camera stream before starting new one');
              await stopCamera();
          }
          localStreams[id] = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: deviceId } },
              audio: false,
          });

          if (peerConnections[id]) {
              peerConnections[id].close();
              delete peerConnections[id];
          }
          initPeerConnection(id);


          localStreams[id].getTracks().forEach((track) => {
              console.log(`Adding track to peer connection ${id}:`, track);
              peerConnections[id].addTrack(track, localStreams[id]);
          });

          const offer = await peerConnections[id].createOffer();
          await peerConnections[id].setLocalDescription(offer);

          console.log(`Sending offer for ${id}:`, peerConnections[id].localDescription);
          window.electronAPI.sendSignalingMessage({
              type: 'offer',
              id: id,
              sdp: peerConnections[id].localDescription.sdp
          });
      } catch (error) {
          console.error('Error starting camera:', error);
      }
  }

  async function stopCamera() {
      const id = 'camera';
      if (localStreams[id]) {
          localStreams[id].getTracks().forEach(track => track.stop());
          delete localStreams[id];
      }
      if (peerConnections[id]) {
          //remove tracks from peer connection
          peerConnections[id].getSenders().forEach(sender => {
              peerConnections[id].removeTrack(sender);
          });

          peerConnections[id].close();
          delete peerConnections[id];
      }
  }

  async function startScreenShare(screenId) {
      const id = 'screen'; // Unique identifier for the screen share
      try {

          //if already sharing screen, stop it
          if (localStreams[id]) {
              console.log('Stopping current screen share before starting new one');
              await stopScreenShare();
          }
          const sources = await window.electronAPI.invoke('get-sources');
          const source = sources.find(s => s.id === screenId);
          if (!source) {
              console.error('Screen source not found');
              return;
          }


          localStreams[id] = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                  mandatory: {
                      chromeMediaSource: 'desktop',
                      chromeMediaSourceId: source.id,
                  },
              },
          });

          if (!peerConnections[id]) {
              initPeerConnection(id);
          }


          localStreams[id].getTracks().forEach(track => peerConnections[id].addTrack(track, localStreams[id]));

          const offer = await peerConnections[id].createOffer();
          await peerConnections[id].setLocalDescription(offer);

          console.log(`Sending offer for ${id}:`, peerConnections[id].localDescription);
          window.electronAPI.sendSignalingMessage({
              type: 'offer',
              id: id,
              sdp: peerConnections[id].localDescription.sdp
          });
      } catch (error) {
          console.error('Error starting screen share:', error);
      }
  }

  async function stopScreenShare() {
      const id = 'screen';
      if (localStreams[id]) {
          localStreams[id].getTracks().forEach(track => track.stop());
          delete localStreams[id];
      }
      if (peerConnections[id]) {

          //remove tracks from peer connection using removeTrack
          peerConnections[id].getSenders().forEach((sender) => {
              if (sender.track && sender.track.kind === 'video') {
                  peerConnections[id].removeTrack(sender);
              }
          });

          peerConnections[id].close();
          delete peerConnections[id];
      }
  }

  async function handleSignalingMessage(data) {
      const id = data.id; // Get the identifier from the signaling message
      if (!id) {
          console.error('No id in signaling message');
          return;
      }

      if (data.type === 'get-cameras') {
          await getCameraList();
      } else if (data.type === 'get-screens') {
          await getScreenList();
      } else if (data.type === 'start-camera') {
          await startCamera(data.deviceId);
      } else if (data.type === 'stop-camera') {
          await stopCamera();
      } else if (data.type === 'start-screen-share') {
          await startScreenShare(data.screenId);
      } else if (data.type === 'stop-screen-share') {
          await stopScreenShare();
      } else if (data.type === 'answer') {
          if (peerConnections[id]) {
              try {
                  console.log(`Received answer for ${id}:`, data.sdp);
                  const answerDescription = {
                      type: 'answer',
                      sdp: data.sdp,
                  };

                  console.log(`Peer connection state for ${id} in answer part:`, peerConnections[id].signalingState);

                  if (peerConnections[id].signalingState === 'have-local-offer') {
                      await peerConnections[id].setRemoteDescription(new RTCSessionDescription(answerDescription));
                  } else {
                      console.error(`Invalid signaling state for setting remote description for ${id}:`, peerConnections[id].signalingState);
                  }
              } catch (e) {
                  console.error(`Error setting remote description for ${id}`, e);
              }
          } else {
              console.error(`No peer connection found for ${id} when receiving answer`);
          }
      } else if (data.type === 'ice-candidate') {
          if (data.candidate && peerConnections[id]) {
              try {
                  console.log(`Adding ICE candidate for ${id}:`, data.candidate);
                  await peerConnections[id].addIceCandidate(data.candidate);
              } catch (e) {
                  console.error(`Error adding received ICE candidate for ${id}`, e);
              }
          } else {
              console.error(`No peer connection found for ${id} when adding ICE candidate`);
          }
      }
  }

  // Listen for signaling messages from the main process
  window.electronAPI.onSignalingMessage(handleSignalingMessage);
})();