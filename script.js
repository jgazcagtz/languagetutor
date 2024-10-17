// Function to open the tutorial modal 
function openTutorial() {
    document.getElementById('tutorial-modal').classList.add('show');
}

// Function to close the tutorial modal
function closeTutorial() {
    document.getElementById('tutorial-modal').classList.remove('show');
}

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

    try {
        // Send the message to the Vercel backend with updated language context and token limit
        const response = await fetch('https://learnwgenglishtutor.vercel.app/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userInput,
                system_prompt: "You are a multilingual language tutor specializing in English, Spanish, French, German, and Portuguese. Answer questions about grammar, vocabulary, pronunciation, and language usage in these languages. Respond in the same language as the user's input, and adapt explanations for each language's nuances.",
                max_tokens: 200 // Set a token limit for each response
            })
        });
        const data = await response.json();

        // Display the bot's response
        chatLog.innerHTML += `<div class="bot-message message">${data.response}</div>`;
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to the bottom

        // Speak the bot's response
        speakText(data.response);
    } catch (error) {
        console.error('Error:', error);
        chatLog.innerHTML += `<div class="bot-message message">Error connecting to the server. Please try again later.</div>`;
        chatLog.scrollTop = chatLog.scrollHeight;
        speakText("Error connecting to the server. Please try again later.");
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
    recognition.lang = 'en-US'; // You can set this dynamically based on user preference
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
    recognition.start();
}

// Speech Synthesis Function
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.warn("Your browser does not support Speech Synthesis.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Optionally, set the voice based on user's language preference
    // For example, you can detect the language from the text or let the user select
    // Here, we'll use the default voice
    speechSynthesis.speak(utterance);
}

// Function to set the current year in the footer (redundant if set in HTML script)
document.getElementById('year').textContent = new Date().getFullYear();

