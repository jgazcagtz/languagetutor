// Function to open the tutorial modal 
function openTutorial() {
    const tutorialModal = document.getElementById('tutorial-modal');
    if (tutorialModal) {
        tutorialModal.classList.add('show');
        tutorialModal.setAttribute('aria-hidden', 'false');
    }
}

// Function to close the tutorial modal
function closeTutorial() {
    const tutorialModal = document.getElementById('tutorial-modal');
    if (tutorialModal) {
        tutorialModal.classList.remove('show');
        tutorialModal.setAttribute('aria-hidden', 'true');
    }
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

// Function to sanitize HTML to prevent XSS
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Function to display messages in the chat log
function displayMessage(message, sender = 'bot') {
    const chatLog = document.getElementById('chat-log');
    const messageElement = document.createElement('div');
    messageElement.classList.add(`${sender}-message`, 'message');
    messageElement.innerHTML = sanitizeHTML(message);
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom
}

// Function to remove the last message from a specific sender (used to remove loading indicators)
function removeLastMessage(sender) {
    const chatLog = document.getElementById('chat-log');
    const messages = chatLog.getElementsByClassName(`${sender}-message`);
    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.textContent === 'Language Tutor is typing...') {
            lastMessage.remove();
        }
    }
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to send a message to the backend and display the response
async function sendMessage(message = null) {
    const userInputElement = document.getElementById('user-input');
    const micButton = document.getElementById('mic-button');
    const sendButton = document.getElementById('send-button');
    const chatLog = document.getElementById('chat-log');

    // Disable input and buttons during processing
    userInputElement.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;

    let userInput;

    if (message) {
        userInput = message;
    } else {
        userInput = userInputElement.value.trim();
        if (!userInput) {
            // Re-enable input and buttons if input is empty
            userInputElement.disabled = false;
            sendButton.disabled = false;
            micButton.disabled = false;
            return; // Prevent sending empty messages
        }
        // Display the user's message
        displayMessage(userInput, 'user');
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
            const confirmationMessage = `You have selected ${capitalizeFirstLetter(lowerCaseInput)}. How can I assist you in ${capitalizeFirstLetter(lowerCaseInput)}?`;
            displayMessage(confirmationMessage, 'bot');
            speakText(confirmationMessage);
        } else {
            // If the input is not a recognized language, ask again
            const promptMessage = "Which language would you like to use? Please choose from English, Spanish, French, German, or Portuguese.";
            displayMessage(promptMessage, 'bot');
            speakText(promptMessage);
        }
        // Re-enable input and buttons after handling language selection
        userInputElement.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false;
        return;
    }

    try {
        // Display a loading indicator
        const loadingMessage = 'Language Tutor is typing...';
        displayMessage(loadingMessage, 'bot');

        // Send the message to the backend
        const response = await fetch('/api/chatbot', { // Use relative path for flexibility
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userInput,
                max_tokens: 200 // Set a token limit for each response
            })
        });

        // Remove the loading indicator
        removeLastMessage('bot');

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display the bot's response
        displayMessage(data.response, 'bot');

        // Speak the bot's response
        speakText(data.response);
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Error connecting to the server. Please try again later.';
        // Remove the loading indicator if present
        removeLastMessage('bot');
        displayMessage(errorMessage, 'bot');
        speakText(errorMessage);
    } finally {
        // Re-enable input and buttons after processing
        userInputElement.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false;
        userInputElement.focus(); // Focus back on the input field
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
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.textContent = '🛑'; // Change icon to stop
            micButton.setAttribute('aria-label', 'Stop voice input');
        }
    };

    recognition.onend = () => {
        recognizing = false;
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.textContent = '🎤'; // Change icon back to mic
            micButton.setAttribute('aria-label', 'Start voice input');
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognizing = false;
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.textContent = '🎤'; // Change icon back to mic
            micButton.setAttribute('aria-label', 'Start voice input');
        }
        const chatLog = document.getElementById('chat-log');
        const errorMessage = 'Speech recognition error. Please try again.';
        displayMessage(errorMessage, 'bot');
        speakText(errorMessage);
    };
}

// Function to toggle voice recognition
function toggleVoiceRecognition() {
    if (!languageSelected) {
        const promptMessage = "Please select a language first by typing it (English, Spanish, French, German, or Portuguese).";
        displayMessage(promptMessage, 'bot');
        speakText(promptMessage);
        return;
    }

    if (recognizing) {
        recognition.stop();
        return;
    }
    if (recognition) {
        recognition.lang = selectedLanguageCode; // Ensure recognition language is up to date
        recognition.start();
    }
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
        const languagePrefix = selectedLanguageCode.split('-')[0];
        selectedVoice = voices.find(voice => voice.lang.startsWith(languagePrefix));
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
function setCurrentYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setCurrentYear();

    const sendButton = document.getElementById('send-button');
    const userInputElement = document.getElementById('user-input');
    const micButton = document.getElementById('mic-button');

    if (sendButton) {
        sendButton.addEventListener('click', () => sendMessage());
    }

    if (userInputElement) {
        userInputElement.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    if (micButton) {
        micButton.addEventListener('click', toggleVoiceRecognition);
    }
});

// Function to initialize speech synthesis voices (for browsers that load voices asynchronously)
function initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.onvoiceschanged = () => {
                // Voices have been loaded
            };
        }
    }
}

initializeSpeechSynthesis();
