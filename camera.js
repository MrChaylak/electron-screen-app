document.addEventListener('DOMContentLoaded', async () => {
    const cameraSelect = document.getElementById('camera-select');
    const startCameraButton = document.getElementById('start-camera');
    const stopCameraButton = document.getElementById('stop-camera');
    const videoFeed = document.getElementById('camera-feed');

    let currentStream = null;

    try {
        // Get the list of media devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Filter for video input devices (cameras)
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Populate the dropdown with camera options
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId; // Use deviceId for selecting the camera
            option.textContent = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        if (videoDevices.length === 0) {
            const noCameraOption = document.createElement('option');
            noCameraOption.value = "";
            noCameraOption.textContent = "No cameras found";
            cameraSelect.appendChild(noCameraOption);
        }

        // Start Camera Button Click
        startCameraButton.addEventListener('click', async () => {
            const selectedDeviceId = cameraSelect.value;

            if (!selectedDeviceId) {
                alert('Please select a camera first!');
                return;
            }

            try {
                // Stop the existing stream if any
                if (currentStream) {
                    stopStream(currentStream);
                }

                // Get the video stream from the selected camera
                currentStream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedDeviceId } }
                });

                // Display the video feed
                videoFeed.srcObject = currentStream;

                // Enable the Stop Camera button
                stopCameraButton.disabled = false;
                startCameraButton.disabled = true;
                cameraSelect.disabled = true;
            } catch (error) {
                console.error('Error starting the camera:', error);
            }
        });

        // Stop Camera Button Click
        stopCameraButton.addEventListener('click', () => {
            if (currentStream) {
                stopStream(currentStream);
                currentStream = null;

                // Clear the video feed
                videoFeed.srcObject = null;

                // Disable the Stop Camera button
                stopCameraButton.disabled = true;
                startCameraButton.disabled = false;
                cameraSelect.disabled = false;
            }
        });

        // Helper function to stop the stream
        function stopStream(stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
    } catch (error) {
        console.error('Error fetching camera devices:', error);
    }
});
