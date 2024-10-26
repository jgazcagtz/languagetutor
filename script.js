// Function to open the tutorial modal 
function openTutorial() {
    document.getElementById('tutorial-modal').classList.add('show');
}

// Function to close the tutorial modal
function closeTutorial() {
    document.getElementById('tutorial-modal').classList.remove('show');
}

// Supported languages with their codes
const supportedLanguages = {
    'english': 'en-US',
    'spanish': 'es-ES',
    'french': 'fr-FR',
    'german': 'de-DE',
    'portuguese': 'pt-PT'
};

// Default selected language code
let selectedLanguageCode = null;
let languageSelected = false;

// Function to send a message to the backend and display the response
async function sendMessage(message = null) {
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

    if (!languageSelected) {
        // Determine the language from the user's input
        const lowerCaseInput = userInput.toLowerCase();
        if (supportedLanguages[lowerCaseInput]) {
            selectedLanguageCode = supportedLanguages[lowerCaseInput];
            languageSelected = true;
            // Set the recognition language
            if (recognition) {
                recognition.lang = selectedLanguageCode;
            }
            // Acknowledge the selected language
            const confirmationMessage = `You have selected ${lowerCaseInput}. How can I assist you in ${lowerCaseInput}?`;
            chatLog.innerHTML += `<div class="bot-message message">${confirmationMessage}</div>`;
            chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom
            speakText(confirmationMessage);
        } else {
            // If the input is not a recognized language, ask again
            const promptMessage = "Which language would you like to use? Please choose from English, Spanish, French, German, or Portuguese.";
            chatLog.innerHTML += `<div class="bot-message message">${promptMessage}</div>`;
            chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom
            speakText(promptMessage);
        }
        return;
    }

    try {
        // Send the message to the backend
        const response = await fetch('https://languagetutor.vercel.app/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userInput,
                max_tokens: 200 // Set a token limit for each response
            })
        });
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display the bot's response
        chatLog.innerHTML += `<div class="bot-message message">${data.response}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom

        // Speak the bot's response
        speakText(data.response);
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Error connecting to the server. Please try again later.';
        chatLog.innerHTML += `<div class="bot-message message">${errorMessage}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
        speakText(errorMessage);
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
    recognition.lang = 'en-US'; // Default language, will be updated after language selection
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
        sendMessage(transcript);
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
    if (languageSelected && recognition) {
        recognition.lang = selectedLanguageCode; // Ensure recognition language is up to date
    }
    recognition.start();
}

// Speech Synthesis Function
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.warn("Your browser does not support Speech Synthesis.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Set the voice based on the selected language
    const voices = speechSynthesis.getVoices();

    // In case voices are not yet loaded, wait for them
    if (voices.length === 0) {
        speechSynthesis.onvoiceschanged = () => {
            setVoice(utterance);
            speechSynthesis.speak(utterance);
        };
    } else {
        setVoice(utterance);
        speechSynthesis.speak(utterance);
    }
}

function setVoice(utterance) {
    const voices = speechSynthesis.getVoices();

    if (!selectedLanguageCode) {
        // Default to US English
        selectedLanguageCode = 'en-US';
    }

    // Try to find a voice that matches the selected language code
    let selectedVoice = voices.find(voice => voice.lang === selectedLanguageCode);

    // If exact match not found, try to find a voice that starts with the language code (e.g., 'en' for 'en-US', 'en-GB')
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith(selectedLanguageCode.split('-')[0]));
    }

    // If still not found, try to find a default voice for the language
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'en-US'); // Fallback to English
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        console.warn(`No voice found for language code ${selectedLanguageCode}. Using default voice.`);
    }
}

// Function to set the current year in the footer
document.getElementById('year').textContent = new Date().getFullYear();
