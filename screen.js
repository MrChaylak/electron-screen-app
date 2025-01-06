document.addEventListener('DOMContentLoaded', async () => {
    const screenList = document.getElementById('screen-list');
    const screenFeed = document.getElementById('screen-feed'); // Reusing the video element for screen feed
    let currentStream = null;

    try {
        const sources = await window.electron.getSources();

        // Populate the screen list with thumbnails
        sources.forEach((source) => {
            const screenOption = document.createElement('div');
            screenOption.className = 'screen-option';
            screenOption.innerHTML = `
                <img src="${source.thumbnail.toDataURL()}" alt="Screen Thumbnail" style="width: 150px; height: auto;" />
                <p>${source.name}</p>
            `;
            screenOption.dataset.id = source.id; // Store the screen ID

            // Click event to start screen sharing
            screenOption.addEventListener('click', async () => {
                if (currentStream) {
                    stopScreenShare(); // Stop any existing screen share
                }

                await startScreenShare(source); // Start sharing the clicked screen
            });

            screenList.appendChild(screenOption);
        });
    } catch (error) {
        console.error('Error fetching screens:', error);
    }

    // Function to start screen sharing
    async function startScreenShare(source) {
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

            // Get the screen stream
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Display the screen feed
            screenFeed.srcObject = currentStream;
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    }

    // Function to stop screen sharing
    function stopScreenShare() {
        if (currentStream) {
            currentStream.getTracks().forEach((track) => track.stop());
            currentStream = null;

            // Clear the video feed
            screenFeed.srcObject = null;
        }
    }
});
