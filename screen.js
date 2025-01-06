document.addEventListener('DOMContentLoaded', async () => {
    const screenList = document.getElementById('screen-list');
    const screenFeed = document.getElementById('screen-feed'); // Video element for screen feed
    const startScreenButton = document.createElement('button');
    const stopScreenButton = document.createElement('button');
    let currentStream = null;

    startScreenButton.id = 'start-screen';
    stopScreenButton.id = 'stop-screen';
    startScreenButton.textContent = 'Start Screen Share';
    stopScreenButton.textContent = 'Stop Screen Share';
    stopScreenButton.disabled = true;
    startScreenButton.disabled = true; // Disabled by default until a screen is selected

    document.body.appendChild(startScreenButton);
    document.body.appendChild(stopScreenButton);

    try {
        const sources = await window.electron.getSources();

        // Populate the screen list
        sources.forEach((source) => {
            const screenOption = document.createElement('div');
            screenOption.className = 'screen-option';
            screenOption.style.cursor = 'pointer';
            screenOption.innerHTML = `
                <img src="${source.thumbnail.toDataURL()}" alt="Screen Thumbnail" style="width: 150px; height: auto;" />
                <p>${source.name}</p>
            `;
            screenOption.dataset.id = source.id;

            // Click event to select a screen
            screenOption.addEventListener('click', () => {
                if (currentStream) return; // Prevent changing options while sharing

                document.querySelectorAll('.screen-option').forEach((el) => el.classList.remove('selected'));
                screenOption.classList.add('selected');
                startScreenButton.disabled = false; // Enable start button when a screen is selected
            });

            screenList.appendChild(screenOption);
        });
    } catch (error) {
        console.error('Error fetching screen sources:', error);
    }

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
        }
    });
});
