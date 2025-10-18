// ==================== STATE MANAGEMENT ====================
const state = {
    conversationHistory: [],
    selectedLanguage: null,
    selectedLanguageCode: null,
    currentMode: 'conversation',
    settings: {
        ttsEnabled: true,
        timestampsEnabled: true,
        darkMode: true
    },
    isProcessing: false
};

// ==================== CONVERSATION STARTERS ====================
const conversationStarters = {
    'en-US': [
        "How do I introduce myself in English?",
        "Teach me common greetings",
        "Help me with verb tenses",
        "What are some useful phrases for travel?"
    ],
    'es-ES': [
        "¿Cómo me presento en español?",
        "Ayúdame con los verbos irregulares",
        "Enséñame frases comunes para viajar",
        "Explica el subjuntivo"
    ],
    'fr-FR': [
        "Comment me présenter en français?",
        "Aidez-moi avec les verbes",
        "Apprenez-moi les salutations courantes",
        "Expliquez les pronoms"
    ],
    'de-DE': [
        "Wie stelle ich mich auf Deutsch vor?",
        "Helfen Sie mir mit den Artikeln",
        "Lehren Sie mich gängige Redewendungen",
        "Erklären Sie die Fälle"
    ],
    'pt-PT': [
        "Como me apresento em português?",
        "Ajude-me com os verbos",
        "Ensine-me saudações comuns",
        "Explique as conjugações"
    ]
};

// Mode configurations
const modeConfig = {
    conversation: {
        icon: 'fa-comments',
        name: 'Conversation Mode',
        systemAddition: ' Focus on natural conversation practice.'
    },
    grammar: {
        icon: 'fa-book',
        name: 'Grammar Help',
        systemAddition: ' Focus on detailed grammar explanations with examples.'
    },
    vocabulary: {
        icon: 'fa-spell-check',
        name: 'Vocabulary Builder',
        systemAddition: ' Focus on teaching new vocabulary with usage examples and context.'
    },
    practice: {
        icon: 'fa-dumbbell',
        name: 'Practice Mode',
        systemAddition: ' Provide practice exercises and quiz the student.'
    },
    assessment: {
        icon: 'fa-chart-line',
        name: 'Assessment Mode',
        systemAddition: ' Evaluate the student\'s level through progressive questioning.'
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeEventListeners();
    loadConversationHistory();
});

function initializeEventListeners() {
    // Language selection
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', () => selectLanguage(
            btn.dataset.lang,
            btn.dataset.name
        ));
    });

    // Sidebar toggle for mobile
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    menuToggle?.addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 968) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Enter key to send
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ==================== LANGUAGE SELECTION ====================
function selectLanguage(langCode, langName) {
    state.selectedLanguageCode = langCode;
    state.selectedLanguage = langName;

    // Update UI
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.language-btn').classList.add('active');

    document.getElementById('current-language').textContent = `Learning ${langName}`;

    // Hide welcome screen, show conversation starters
    hideWelcome();
    showConversationStarters();

    // Update speech recognition language
    if (recognition) {
        recognition.lang = langCode;
    }

    // Clear previous conversation when switching languages
    if (state.conversationHistory.length > 0) {
        if (confirm('Switching languages will clear your current conversation. Continue?')) {
            clearChat();
        } else {
            return;
        }
    }

    // Show initial greeting
    addBotMessage(`Great! Let's learn ${langName} together. How can I help you today?`);
}

function showConversationStarters() {
    const startersContainer = document.getElementById('conversation-starters');
    const starterGrid = document.getElementById('starter-grid');

    if (!state.selectedLanguageCode) return;

    starterGrid.innerHTML = '';
    const starters = conversationStarters[state.selectedLanguageCode] || [];

    starters.forEach(starter => {
        const btn = document.createElement('button');
        btn.className = 'starter-btn';
        btn.textContent = starter;
        btn.onclick = () => {
            sendMessage(starter);
            startersContainer.style.display = 'none';
        };
        starterGrid.appendChild(btn);
    });

    startersContainer.style.display = 'block';
}

// ==================== MODE MANAGEMENT ====================
function setMode(mode) {
    state.currentMode = mode;

    // Update UI
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.action-btn').classList.add('active');

    const config = modeConfig[mode];
    const indicator = document.getElementById('mode-indicator');
    indicator.innerHTML = `<i class="fas ${config.icon}"></i><span>${config.name}</span>`;

    // Add system message
    addSystemMessage(`Switched to ${config.name}`);
}

function addSystemMessage(text) {
    const chatLog = document.getElementById('chat-log');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.style.cssText = 'text-align: center; padding: 8px; font-size: 0.875rem; color: var(--text-muted); margin: 16px 0;';
    systemMsg.textContent = text;
    chatLog.appendChild(systemMsg);
    scrollToBottom();
}

// ==================== MESSAGE HANDLING ====================
async function sendMessage(messageText = null) {
    if (state.isProcessing) return;

    const userInput = document.getElementById('user-input');
    const message = messageText || userInput.value.trim();

    if (!message) return;

    if (!state.selectedLanguageCode) {
        alert('Please select a language first!');
        return;
    }

    // Clear input
    if (!messageText) {
        userInput.value = '';
    }

    // Add user message to UI
    addUserMessage(message);

    // Add to conversation history
    state.conversationHistory.push({
        role: 'user',
        content: message
    });

    // Save history
    saveConversationHistory();

    // Show typing indicator
    showTypingIndicator();
    state.isProcessing = true;

    try {
        const response = await fetch('https://languagetutor.vercel.app/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                conversationHistory: state.conversationHistory,
                language: state.selectedLanguage,
                mode: state.currentMode,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Add bot response to history
        state.conversationHistory.push({
            role: 'assistant',
            content: data.response
        });

        // Save history
        saveConversationHistory();

        // Add bot message to UI
        addBotMessage(data.response);

        // Text-to-speech
        if (state.settings.ttsEnabled) {
            speakText(data.response);
        }
    } catch (error) {
        console.error('Error:', error);
        addBotMessage('Sorry, I encountered an error. Please try again.');
    } finally {
        hideTypingIndicator();
        state.isProcessing = false;
    }
}

// ==================== UI MESSAGE FUNCTIONS ====================
function addUserMessage(text) {
    const chatLog = document.getElementById('chat-log');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';

    const timestamp = state.settings.timestampsEnabled ? getCurrentTime() : '';

    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <div class="message-text">${escapeHtml(text)}</div>
            ${timestamp ? `
                <div class="message-footer">
                    <span class="message-time">${timestamp}</span>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="copyMessage(this)" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    chatLog.appendChild(messageDiv);
    scrollToBottom();
}

function addBotMessage(text) {
    const chatLog = document.getElementById('chat-log');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    const timestamp = state.settings.timestampsEnabled ? getCurrentTime() : '';

    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="message-text">${formatBotMessage(text)}</div>
            ${timestamp ? `
                <div class="message-footer">
                    <span class="message-time">${timestamp}</span>
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="copyMessage(this)" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn" onclick="speakMessage(this)" title="Speak">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    chatLog.appendChild(messageDiv);
    scrollToBottom();
}

function formatBotMessage(text) {
    // Basic markdown-like formatting
    let formatted = escapeHtml(text);
    
    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code `text`
    formatted = formatted.replace(/`(.*?)`/g, '<code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;">$1</code>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    const chatArea = document.getElementById('chat-area');
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ==================== MESSAGE ACTIONS ====================
function copyMessage(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text').textContent;
    navigator.clipboard.writeText(messageText).then(() => {
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalHtml;
        }, 2000);
    });
}

function speakMessage(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text').textContent;
    speakText(messageText);
}

// ==================== TYPING INDICATOR ====================
function showTypingIndicator() {
    document.getElementById('typing-indicator').style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    document.getElementById('typing-indicator').style.display = 'none';
}

// ==================== VOICE RECOGNITION ====================
let recognition;
let recognizing = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        recognizing = true;
        const micBtn = document.getElementById('mic-button');
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<i class="fas fa-stop"></i>';
    };

    recognition.onend = () => {
        recognizing = false;
        const micBtn = document.getElementById('mic-button');
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognizing = false;
        const micBtn = document.getElementById('mic-button');
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        
        if (event.error === 'no-speech') {
            addSystemMessage('No speech detected. Please try again.');
        }
    };
}

function toggleVoiceRecognition() {
    if (!recognition) {
        alert('Voice recognition is not supported in your browser.');
        return;
    }

    if (!state.selectedLanguageCode) {
        alert('Please select a language first!');
        return;
    }

    if (recognizing) {
        recognition.stop();
        return;
    }

    recognition.lang = state.selectedLanguageCode;
    recognition.start();
}

// ==================== TEXT-TO-SPEECH ====================
function speakText(text) {
    if (!state.settings.ttsEnabled || !('speechSynthesis' in window)) {
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Set voice based on selected language
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        const voice = voices.find(v => v.lang === state.selectedLanguageCode) ||
                     voices.find(v => v.lang.startsWith(state.selectedLanguageCode?.split('-')[0])) ||
                     voices[0];
        utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
}

// Ensure voices are loaded
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// ==================== SETTINGS ====================
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('show');
}

function toggleTTS() {
    state.settings.ttsEnabled = document.getElementById('tts-toggle').checked;
    saveSettings();
}

function toggleTimestamps() {
    state.settings.timestampsEnabled = document.getElementById('timestamp-toggle').checked;
    saveSettings();
}

function toggleTheme() {
    state.settings.darkMode = document.getElementById('theme-toggle').checked;
    document.body.classList.toggle('light-theme', !state.settings.darkMode);
    saveSettings();
}

function loadSettings() {
    const saved = localStorage.getItem('languageTutorSettings');
    if (saved) {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
        
        // Apply settings to UI
        document.getElementById('tts-toggle').checked = state.settings.ttsEnabled;
        document.getElementById('timestamp-toggle').checked = state.settings.timestampsEnabled;
        document.getElementById('theme-toggle').checked = state.settings.darkMode;
        document.body.classList.toggle('light-theme', !state.settings.darkMode);
    }
}

function saveSettings() {
    localStorage.setItem('languageTutorSettings', JSON.stringify(state.settings));
}

// ==================== CONVERSATION PERSISTENCE ====================
function saveConversationHistory() {
    if (state.selectedLanguageCode) {
        const key = `conversation_${state.selectedLanguageCode}`;
        localStorage.setItem(key, JSON.stringify(state.conversationHistory));
    }
}

function loadConversationHistory() {
    if (state.selectedLanguageCode) {
        const key = `conversation_${state.selectedLanguageCode}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            state.conversationHistory = JSON.parse(saved);
            // Optionally restore messages to UI
        }
    }
}

function clearChat() {
    if (confirm('Are you sure you want to clear the conversation?')) {
        state.conversationHistory = [];
        document.getElementById('chat-log').innerHTML = '';
        
        if (state.selectedLanguageCode) {
            const key = `conversation_${state.selectedLanguageCode}`;
            localStorage.removeItem(key);
        }
        
        if (state.selectedLanguage) {
            addBotMessage(`Conversation cleared. Let's start fresh with ${state.selectedLanguage}!`);
        }
        
        showConversationStarters();
    }
}

// ==================== MODALS ====================
function openTutorial() {
    document.getElementById('tutorial-modal').classList.add('show');
}

function closeTutorial() {
    document.getElementById('tutorial-modal').classList.remove('show');
}

function hideWelcome() {
    const welcomeScreen = document.getElementById('welcome-screen');
    welcomeScreen.classList.add('fade-out');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
    }, 300);
}

// ==================== UTILITY FUNCTIONS ====================
// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Prevent modal close when clicking inside modal content
document.querySelectorAll('.modal-content').forEach(modal => {
    modal.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
