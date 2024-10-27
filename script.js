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

    // Deshabilitar inputs y botones durante el procesamiento
    userInputElement.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;

    let userInput;

    if (message) {
        userInput = message;
    } else {
        userInput = userInputElement.value.trim();
        if (!userInput) {
            // Rehabilitar inputs y botones si la entrada está vacía
            userInputElement.disabled = false;
            sendButton.disabled = false;
            micButton.disabled = false;
            return; // Prevenir el envío de mensajes vacíos
        }
        // Mostrar el mensaje del usuario
        displayMessage(userInput, 'user');
        userInputElement.value = ''; // Limpiar la entrada
    }

    if (!languageSelected) {
        // Determinar el idioma a partir de la entrada del usuario
        const lowerCaseInput = userInput.toLowerCase();
        if (supportedLanguages[lowerCaseInput]) {
            selectedLanguageCode = supportedLanguages[lowerCaseInput];
            languageSelected = true;
            // Configurar el idioma del reconocimiento de voz
            if (recognition) {
                recognition.lang = selectedLanguageCode;
            }
            // Acknowledge the selected language
            const confirmationMessage = `Has seleccionado ${capitalizeFirstLetter(lowerCaseInput)}. ¿Cómo puedo ayudarte en ${capitalizeFirstLetter(lowerCaseInput)}?`;
            displayMessage(confirmationMessage, 'bot');
            speakText(confirmationMessage);
        } else {
            // Si la entrada no es un idioma reconocido, preguntar nuevamente
            const promptMessage = "¿Qué idioma te gustaría usar? Por favor, elige entre Inglés, Español, Francés, Alemán o Portugués.";
            displayMessage(promptMessage, 'bot');
            speakText(promptMessage);
        }
        // Rehabilitar inputs y botones después de manejar la selección de idioma
        userInputElement.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false;
        return;
    }

    try {
        // Mostrar un indicador de carga
        const loadingMessage = 'Language Tutor está escribiendo...';
        displayMessage(loadingMessage, 'bot');

        // Enviar el mensaje al backend
        const response = await fetch(`${window.location.origin}/api/chatbot`, { // Usar ruta absoluta dinámica
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userInput,
                max_tokens: 200 // Establecer un límite de tokens para cada respuesta
            })
        });

        // Eliminar el indicador de carga
        removeLastMessage('bot');

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Mostrar la respuesta del bot
        displayMessage(data.response, 'bot');

        // Reproducir la respuesta del bot
        speakText(data.response);
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Error al conectar con el servidor. Por favor, inténtalo de nuevo más tarde.';
        // Eliminar el indicador de carga si está presente
        removeLastMessage('bot');
        displayMessage(errorMessage, 'bot');
        speakText(errorMessage);
    } finally {
        // Rehabilitar inputs y botones después del procesamiento
        userInputElement.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false;
        userInputElement.focus(); // Enfocar de nuevo el campo de entrada
    }
}

// Voice Recognition Setup
let recognition;
let recognizing = false;

// Check for browser support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Tu navegador no soporta el Reconocimiento de Voz. Por favor, usa un navegador compatible como Chrome.");
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Idioma por defecto, se actualizará después de la selección de idioma
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        recognizing = true;
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.textContent = '🛑'; // Cambiar ícono a detener
            micButton.setAttribute('aria-label', 'Detener entrada de voz');
        }
    };

    recognition.onend = () => {
        recognizing = false;
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.textContent = '🎤'; // Cambiar ícono de nuevo a micrófono
            micButton.setAttribute('aria-label', 'Iniciar entrada de voz');
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Error en el reconocimiento de voz:', event.error);
        recognizing = false;
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.textContent = '🎤'; // Cambiar ícono de nuevo a micrófono
            micButton.setAttribute('aria-label', 'Iniciar entrada de voz');
        }
        const chatLog = document.getElementById('chat-log');
        const errorMessage = 'Error en el reconocimiento de voz. Por favor, inténtalo de nuevo.';
        displayMessage(errorMessage, 'bot');
        speakText(errorMessage);
    };
}

// Function to toggle voice recognition
function toggleVoiceRecognition() {
    if (!languageSelected) {
        const promptMessage = "Por favor, selecciona un idioma primero escribiéndolo (Inglés, Español, Francés, Alemán o Portugués).";
        displayMessage(promptMessage, 'bot');
        speakText(promptMessage);
        return;
    }

    if (recognizing) {
        recognition.stop();
        return;
    }
    if (recognition) {
        recognition.lang = selectedLanguageCode; // Asegurar que el idioma de reconocimiento esté actualizado
        recognition.start();
    }
}

// Speech Synthesis Function
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.warn("Tu navegador no soporta la Síntesis de Voz.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Establecer la voz basada en el idioma seleccionado
    const voices = speechSynthesis.getVoices();

    // En caso de que las voces aún no estén cargadas, esperar a que lo estén
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
        // Predeterminar a Inglés de EE.UU.
        selectedLanguageCode = 'en-US';
    }

    // Intentar encontrar una voz que coincida con el código de idioma seleccionado
    let selectedVoice = voices.find(voice => voice.lang === selectedLanguageCode);

    // Si no se encuentra una coincidencia exacta, intentar encontrar una voz que comience con el prefijo del idioma
    if (!selectedVoice) {
        const languagePrefix = selectedLanguageCode.split('-')[0];
        selectedVoice = voices.find(voice => voice.lang.startsWith(languagePrefix));
    }

    // Si aún no se encuentra, usar una voz predeterminada (Inglés de EE.UU.)
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'en-US');
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        console.warn(`No se encontró una voz para el código de idioma ${selectedLanguageCode}. Usando la voz predeterminada.`);
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
                // Las voces han sido cargadas
            };
        }
    }
}

initializeSpeechSynthesis();
