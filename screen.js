document.addEventListener('DOMContentLoaded', async () => {
    const screenListContainer = document.createElement('div');
    const screenList = document.createElement('div');
    const screenFeed = document.getElementById('screen-feed'); // Video element for screen feed
    const startScreenButton = document.createElement('button');
    const stopScreenButton = document.createElement('button');
    let currentStream = null;
    let updateInterval = null; // Interval for updating screen options
    const sourceSnapshots = new Map(); // To store static snapshots for window options

    screenListContainer.id = 'screen-list-container';
    screenList.id = 'screen-list';
    screenList.style.display = 'grid'; // Use grid layout
    screenList.style.gridTemplateColumns = 'repeat(3, 1fr)';
    screenList.style.gap = '10px';
    screenListContainer.style.display = 'none'; // Initially hide the screen options

    startScreenButton.id = 'start-screen';
    stopScreenButton.id = 'stop-screen';
    startScreenButton.textContent = 'Show Screen Options';
    stopScreenButton.textContent = 'Stop Screen Share';
    stopScreenButton.disabled = true;

    document.body.appendChild(startScreenButton);
    document.body.appendChild(stopScreenButton);
    document.body.appendChild(screenListContainer);
    screenListContainer.appendChild(screenList);

    // Function to capture a single snapshot for a source
    async function captureSnapshot(sourceId) {
        try {
            const constraints = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                    },
                },
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.createElement('video');
            video.srcObject = stream;

            // Wait for the video to load metadata
            await new Promise((resolve) => (video.onloadedmetadata = resolve));
            video.play();

            // Capture the snapshot
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Stop the stream after capturing the snapshot
            stream.getTracks().forEach((track) => track.stop());

            // Return the data URL of the snapshot
            return canvas.toDataURL();
        } catch (error) {
            console.error('Error capturing snapshot:', error);
            return null;
        }
    }

    // Function to update the screen list dynamically
    async function updateScreenOptions() {
        try {
            const sources = await window.electron.getSources();

            // Clear and repopulate the screen list
            screenList.innerHTML = '';
            for (const source of sources) {
                const screenOption = document.createElement('div');
                screenOption.className = 'screen-option';
                screenOption.style.cursor = 'pointer';
                screenOption.style.textAlign = 'center';
                screenOption.style.border = '1px solid #ccc';
                screenOption.style.padding = '10px';
                screenOption.style.borderRadius = '4px';
                screenOption.style.backgroundColor = '#f9f9f9';

                let thumbnail;

                if (source.name.toLowerCase().includes('entire screen')) {
                    // Use the default thumbnail for "Entire Screen"
                    thumbnail = source.thumbnail.toDataURL();
                } else {
                    // Capture or use cached snapshot for other options
                    if (!sourceSnapshots.has(source.id)) {
                        const snapshot = await captureSnapshot(source.id);
                        if (snapshot) {
                            sourceSnapshots.set(source.id, snapshot);
                        }
                    }
                    thumbnail = sourceSnapshots.get(source.id) || source.thumbnail.toDataURL();
                }

                screenOption.innerHTML = `
                    <img src="${thumbnail}" alt="Screen Thumbnail" style="width: 100%; height: auto;" />
                    <p>${source.name}</p>
                `;
                screenOption.dataset.id = source.id;

                // Click event to start sharing the screen
                screenOption.addEventListener('click', async () => {
                    try {
                        const constraints = {
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id,
                                },
                            },
                        };

                        // Stop any existing stream
                        if (currentStream) {
                            currentStream.getTracks().forEach((track) => track.stop());
                        }

                        // Start the selected screen stream
                        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                        screenFeed.srcObject = currentStream;

                        // Update button and UI states
                        stopScreenButton.disabled = false;
                        startScreenButton.disabled = true; // Disable the "Show Screen Options" button
                        screenListContainer.style.display = 'none'; // Hide the options after selection

                        // Stop the interval for updating options
                        clearInterval(updateInterval);
                        updateInterval = null;
                    } catch (error) {
                        console.error('Error starting screen share:', error);
                    }
                });

                screenList.appendChild(screenOption);
            }

            // Handle no screens case
            if (sources.length === 0) {
                const noScreenOption = document.createElement('p');
                noScreenOption.textContent = 'No screens found';
                screenList.appendChild(noScreenOption);
            }
        } catch (error) {
            console.error('Error updating screen options:', error);
        }
    }

    // Toggle screen options visibility when "Show Screen Options" is clicked
    startScreenButton.addEventListener('click', async () => {
        if (screenListContainer.style.display === 'none') {
            screenListContainer.style.display = 'block';
            await updateScreenOptions(); // Refresh the options

            // Start the interval to update options every 5 seconds
            if (!updateInterval) {
                updateInterval = setInterval(updateScreenOptions, 5000);
            }
        } else {
            screenListContainer.style.display = 'none';

            // Stop the interval for updating options
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
        }
    });

    // Stop Screen Sharing
    stopScreenButton.addEventListener('click', () => {
        if (currentStream) {
            // Stop the stream
            currentStream.getTracks().forEach((track) => track.stop());
            currentStream = null;

            // Clear the video feed
            screenFeed.srcObject = null;

            // Update button and UI states
            stopScreenButton.disabled = true;
            startScreenButton.disabled = false;
        }
    });
});
