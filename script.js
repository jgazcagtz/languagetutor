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
        if (!userInput) return;
        chatLog.innerHTML += `<div class="user-message message">${userInput}</div>`;
        userInputElement.value = '';
    }

    if (!languageSelected) {
        // Prompt for language selection if not yet selected
        const lowerCaseInput = userInput.toLowerCase();
        if (supportedLanguages[lowerCaseInput]) {
            selectedLanguageCode = supportedLanguages[lowerCaseInput];
            languageSelected = true;
            if (recognition) recognition.lang = selectedLanguageCode;
            const confirmationMessage = `You have selected ${lowerCaseInput}. How can I assist you in ${lowerCaseInput}?`;
            chatLog.innerHTML += `<div class="bot-message message">${confirmationMessage}</div>`;
            chatLog.scrollTop = chatLog.scrollHeight;
            speakText(confirmationMessage);
        } else {
            // Handle case where the language is unrecognized
            const promptMessage = "Please select a language: English, Spanish, French, German, or Portuguese.";
            chatLog.innerHTML += `<div class="bot-message message">${promptMessage}</div>`;
            chatLog.scrollTop = chatLog.scrollHeight;
            speakText(promptMessage);
        }
        return;
    }

    try {
        const response = await fetch('https://languagetutor.vercel.app/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userInput,
                max_tokens: 300 // Token limit for each response
            })
        });
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        chatLog.innerHTML += `<div class="bot-message message">${data.response}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
        speakText(data.response);
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'There was an issue connecting to the server. Please try again later.';
        chatLog.innerHTML += `<div class="bot-message message">${errorMessage}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
        speakText(errorMessage);
    }
}

// Voice Recognition Setup
let recognition;
let recognizing = false;

if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Your browser does not support Speech Recognition. Please use a compatible browser like Chrome.");
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        recognizing = true;
        document.getElementById('mic-button').textContent = '🛑';
    };

    recognition.onend = () => {
        recognizing = false;
        document.getElementById('mic-button').textContent = '🎤';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognizing = false;
        document.getElementById('mic-button').textContent = '🎤';
    };
}

// Function to toggle voice recognition
function toggleVoiceRecognition() {
    if (recognizing) {
        recognition.stop();
        return;
    }
    if (languageSelected && recognition) {
        recognition.lang = selectedLanguageCode;
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
    const voices = speechSynthesis.getVoices();

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
    if (!selectedLanguageCode) selectedLanguageCode = 'en-US';

    let selectedVoice = voices.find(voice => voice.lang === selectedLanguageCode);

    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith(selectedLanguageCode.split('-')[0]));
    }

    if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang === 'en-US');

    if (selectedVoice) utterance.voice = selectedVoice;
}

// Set the current year in the footer
document.getElementById('year').textContent = new Date().getFullYear();
