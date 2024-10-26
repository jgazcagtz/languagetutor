// Function to open the tutorial modal 
function openTutorial() {
    document.getElementById('tutorial-modal').classList.add('show');
}

// Function to close the tutorial modal
function closeTutorial() {
    document.getElementById('tutorial-modal').classList.remove('show');
}

// Function to send a message to the backend and display the response
async function sendMessage(message = null, isVoiceInput = false) {
    const userInputElement = document.getElementById('user-input');
    const chatLog = document.getElementById('chat-log');
    let userInput;

    if (message) {
        userInput = message;
    } else {
        userInput = userInputElement.value.trim();
        if (!userInput) return; // Prevent sending empty messages
        // Display the user's message
        chatLog.innerHTML += `<div class="user-message message">${userInput}</div>`;
        userInputElement.value = ''; // Clear input
    }

    try {
        // Send the message to the backend
        const response = await fetch('https://languagetutor.vercel.app/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userInput
            })
        });
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display the bot's response
        chatLog.innerHTML += `<div class="bot-message message">${data.response}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom

        // Only speak the bot's response if the user used voice input
        if (isVoiceInput) {
            // Use the detected language code from the backend
            speakText(data.response, data.languageCode);
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Error connecting to the server. Please try again later.';
        chatLog.innerHTML += `<div class="bot-message message">${errorMessage}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
    }
}

// Voice Recognition Setup
let recognition;
let recognizing = false;

// Check for browser support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Your browser does not support Speech Recognition. Please use a compatible browser like Chrome.");
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Default language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        recognizing = true;
        document.getElementById('mic-button').textContent = '🛑'; // Change icon to stop
    };

    recognition.onend = () => {
        recognizing = false;
        document.getElementById('mic-button').textContent = '🎤'; // Change icon back to mic
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript, true); // Indicate that this was voice input
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognizing = false;
        document.getElementById('mic-button').textContent = '🎤'; // Change icon back to mic
    };
}

// Function to toggle voice recognition
function toggleVoiceRecognition() {
    if (recognizing) {
        recognition.stop();
        return;
    }
    recognition.start();
}

// Speech Synthesis Function
function speakText(text, languageCode) {
    if (!('speechSynthesis' in window)) {
        console.warn("Your browser does not support Speech Synthesis.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Set the voice based on the language code
    const voices = speechSynthesis.getVoices();

    // In case voices are not yet loaded, wait for them
    if (voices.length === 0) {
        speechSynthesis.onvoiceschanged = () => {
            setVoice(utterance, languageCode);
            speechSynthesis.speak(utterance);
        };
    } else {
        setVoice(utterance, languageCode);
        speechSynthesis.speak(utterance);
    }
}

function setVoice(utterance, languageCode) {
    const voices = speechSynthesis.getVoices();

    // Try to find a voice that matches the language code
    let selectedVoice = voices.find(voice => voice.lang === languageCode);

    // If exact match not found, try to find a voice that starts with the language code
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith(languageCode.split('-')[0]));
    }

    // If still not found, default to English
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'en-US');
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        console.warn(`No voice found for language code ${languageCode}. Using default voice.`);
    }
}

// Function to set the current year in the footer
document.getElementById('year').textContent = new Date().getFullYear();
