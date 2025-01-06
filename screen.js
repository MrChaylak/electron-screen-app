document.addEventListener('DOMContentLoaded', async () => {
    const screenList = document.getElementById('screen-list');
    const screenFeed = document.getElementById('screen-feed'); // Video element for screen feed
    const startScreenButton = document.createElement('button');
    const stopScreenButton = document.createElement('button');
    let currentStream = null;
    let currentSelectedScreenId = null;

    startScreenButton.id = 'start-screen';
    stopScreenButton.id = 'stop-screen';
    startScreenButton.textContent = 'Start Screen Share';
    stopScreenButton.textContent = 'Stop Screen Share';
    stopScreenButton.disabled = true;
    startScreenButton.disabled = true;

    document.body.appendChild(startScreenButton);
    document.body.appendChild(stopScreenButton);

    // Function to update the screen list dynamically
    async function updateScreenOptions() {
        try {
            const sources = await window.electron.getSources();

            // Get the current selected screen
            const selectedScreen = currentSelectedScreenId;

            // Clear and repopulate the screen list
            screenList.innerHTML = '';
            sources.forEach((source) => {
                const screenOption = document.createElement('div');
                screenOption.className = 'screen-option';
                screenOption.style.cursor = currentStream ? 'default' : 'pointer';
                screenOption.style.opacity = currentStream ? '0.5' : '1';
                screenOption.innerHTML = `
                    <img src="${source.thumbnail.toDataURL()}" alt="Screen Thumbnail" style="width: 150px; height: auto;" />
                    <p>${source.name}</p>
                `;
                screenOption.dataset.id = source.id;

                // Highlight the previously selected screen
                if (source.id === selectedScreen) {
                    screenOption.classList.add('selected');
                    startScreenButton.disabled = true;
                }

                // Click event to select a screen (only if sharing is not active)
                if (!currentStream) {
                    screenOption.addEventListener('click', () => {
                        document.querySelectorAll('.screen-option').forEach((el) => el.classList.remove('selected'));
                        screenOption.classList.add('selected');
                        currentSelectedScreenId = source.id; // Store the selected screen ID
                        startScreenButton.disabled = false; // Enable the start button
                    });
                }

                screenList.appendChild(screenOption);
            });

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

    // Call the function every 5 seconds to check for new screens
    setInterval(updateScreenOptions, 5000);

    // Initial population of screen options
    await updateScreenOptions();

    // Start Screen Sharing
    startScreenButton.addEventListener('click', async () => {
        const selectedOption = document.querySelector('.screen-option.selected');

        if (!selectedOption) {
            alert('Please select a screen to share!');
            return;
        }

        const sourceId = selectedOption.dataset.id;

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

            // Start screen sharing
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            screenFeed.srcObject = currentStream;

            // Update button and UI states
            startScreenButton.disabled = true;
            stopScreenButton.disabled = false;

            // Disable screen options
            document.querySelectorAll('.screen-option').forEach((el) => {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.5';
            });
        } catch (error) {
            console.error('Error starting screen share:', error);
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
            startScreenButton.disabled = true;
            stopScreenButton.disabled = true;

            // Re-enable screen options
            document.querySelectorAll('.screen-option').forEach((el) => {
                el.style.pointerEvents = 'auto';
                el.style.opacity = '1';
            });

            currentSelectedScreenId = null; // Reset the selected screen
        }
    });
});
