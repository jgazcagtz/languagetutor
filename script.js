// ==================== STATE MANAGEMENT ====================
const state = {
    conversationHistory: [],
    selectedLanguage: null,
    selectedLanguageCode: null,
    currentMode: 'conversation',
    settings: {
        ttsEnabled: true,
        timestampsEnabled: true,
        darkMode: true,
        autoPlay: true,
        voiceNotifications: true
    },
    voiceSettings: {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        selectedVoice: null,
        continuousListening: false
    },
    isProcessing: false,
    isRecording: false,
    recordingStartTime: null,
    recordingTimer: null,
    audioContext: null,
    analyser: null,
    microphone: null,
    animationId: null
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

const languageNames = {
    'en-US': 'English',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'pt-PT': 'Portuguese'
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
    loadVoiceSettings();
    initializeEventListeners();
    initializeVoices();
    loadConversationHistory();
    setupKeyboardShortcuts();
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

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Space for voice input
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            toggleVoiceRecognition();
        }
        // Escape to cancel voice recording
        if (e.key === 'Escape' && state.isRecording) {
            cancelVoiceRecording();
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

    // Update voice settings display
    updateRecognitionLanguageDisplay();

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
        if (state.settings.autoPlay && state.settings.ttsEnabled) {
            speakText(data.response);
        }

        // Continue listening if continuous mode is on
        if (state.voiceSettings.continuousListening && recognition && !state.isRecording) {
            setTimeout(() => {
                if (state.voiceSettings.continuousListening) {
                    toggleVoiceRecognition();
                }
            }, 1000);
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

// ==================== ADVANCED VOICE RECOGNITION ====================
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
        state.isRecording = true;
        showRecordingPanel();
        startRecordingTimer();
        startAudioVisualization();
        
        const micBtn = document.getElementById('mic-button');
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<i class="fas fa-stop"></i>';
    };

    recognition.onend = () => {
        recognizing = false;
        state.isRecording = false;
        hideRecordingPanel();
        stopRecordingTimer();
        stopAudioVisualization();
        
        const micBtn = document.getElementById('mic-button');
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        if (state.settings.voiceNotifications) {
            playNotificationSound('success');
        }
        
        document.getElementById('user-input').value = transcript;
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognizing = false;
        state.isRecording = false;
        hideRecordingPanel();
        stopRecordingTimer();
        stopAudioVisualization();
        
        const micBtn = document.getElementById('mic-button');
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        
        if (event.error === 'no-speech') {
            addSystemMessage('No speech detected. Please try again.');
        } else if (event.error === 'audio-capture') {
            addSystemMessage('No microphone detected. Please check your microphone.');
        } else if (event.error !== 'aborted') {
            addSystemMessage(`Voice recognition error: ${event.error}`);
        }
        
        if (state.settings.voiceNotifications) {
            playNotificationSound('error');
        }
    };
}

function toggleVoiceRecognition() {
    if (!recognition) {
        alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
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

function cancelVoiceRecording() {
    if (recognition && recognizing) {
        recognition.abort();
    }
}

function stopVoiceRecording() {
    if (recognition && recognizing) {
        recognition.stop();
    }
}

// ==================== CONTINUOUS LISTENING MODE ====================
function toggleContinuousMode() {
    state.voiceSettings.continuousListening = !state.voiceSettings.continuousListening;
    
    const btn = document.getElementById('continuous-mode-btn');
    if (state.voiceSettings.continuousListening) {
        btn.classList.add('recording');
        btn.style.background = 'var(--success-gradient)';
        addSystemMessage('Continuous listening mode enabled');
        
        // Start listening if not already
        if (!recognizing && state.selectedLanguageCode) {
            toggleVoiceRecognition();
        }
    } else {
        btn.classList.remove('recording');
        btn.style.background = '';
        addSystemMessage('Continuous listening mode disabled');
    }
    
    // Sync with settings modal
    document.getElementById('continuous-listening-toggle').checked = state.voiceSettings.continuousListening;
    saveVoiceSettings();
}

// ==================== RECORDING PANEL UI ====================
function showRecordingPanel() {
    const panel = document.getElementById('voice-recording-panel');
    const langName = languageNames[state.selectedLanguageCode] || 'the selected language';
    document.getElementById('recording-language').textContent = langName;
    panel.style.display = 'block';
    state.recordingStartTime = Date.now();
}

function hideRecordingPanel() {
    document.getElementById('voice-recording-panel').style.display = 'none';
}

function startRecordingTimer() {
    state.recordingStartTime = Date.now();
    state.recordingTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('recording-timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecordingTimer() {
    if (state.recordingTimer) {
        clearInterval(state.recordingTimer);
        state.recordingTimer = null;
    }
}

// ==================== AUDIO VISUALIZATION ====================
async function startAudioVisualization() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioContext.createAnalyser();
        state.microphone = state.audioContext.createMediaStreamSource(stream);
        
        state.analyser.fftSize = 256;
        state.microphone.connect(state.analyser);
        
        visualizeAudio();
    } catch (error) {
        console.error('Error accessing microphone for visualization:', error);
    }
}

function visualizeAudio() {
    const canvas = document.getElementById('voice-canvas');
    const canvasContext = canvas.getContext('2d');
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
        if (!state.isRecording) return;
        
        state.animationId = requestAnimationFrame(draw);
        
        state.analyser.getByteFrequencyData(dataArray);
        
        // Clear canvas
        canvasContext.fillStyle = 'rgba(26, 26, 46, 0.3)';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw waveform
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
            
            // Gradient color
            const gradient = canvasContext.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            
            canvasContext.fillStyle = gradient;
            canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        // Update volume level bar
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const level = (average / 255) * 100;
        document.getElementById('voice-level-fill').style.width = level + '%';
    };
    
    draw();
}

function stopAudioVisualization() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    
    if (state.microphone) {
        state.microphone.disconnect();
        state.microphone = null;
    }
    
    if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
    }
    
    document.getElementById('voice-level-fill').style.width = '0%';
}

// ==================== TEXT-TO-SPEECH WITH ADVANCED SETTINGS ====================
function speakText(text) {
    if (!state.settings.ttsEnabled || !('speechSynthesis' in window)) {
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.voiceSettings.rate;
    utterance.pitch = state.voiceSettings.pitch;
    utterance.volume = state.voiceSettings.volume;

    // Set voice based on settings
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        if (state.voiceSettings.selectedVoice) {
            const voice = voices.find(v => v.name === state.voiceSettings.selectedVoice);
            if (voice) {
                utterance.voice = voice;
            }
        }
        
        // Fallback to language-appropriate voice
        if (!utterance.voice && state.selectedLanguageCode) {
            const voice = voices.find(v => v.lang === state.selectedLanguageCode) ||
                         voices.find(v => v.lang.startsWith(state.selectedLanguageCode?.split('-')[0]));
            if (voice) utterance.voice = voice;
        }
    }

    speechSynthesis.speak(utterance);
}

// Initialize voices
function initializeVoices() {
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
            populateVoiceList();
        };
        // Initial population
        setTimeout(populateVoiceList, 100);
    }
}

function populateVoiceList() {
    const voiceSelect = document.getElementById('voice-select');
    if (!voiceSelect) return;
    
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '<option value="">Auto (Default)</option>';
    
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name === state.voiceSettings.selectedVoice) {
            option.selected = true;
        }
        voiceSelect.appendChild(option);
    });
}

// ==================== VOICE SETTINGS ====================
function openVoiceSettings() {
    document.getElementById('voice-settings-modal').classList.add('show');
    updateRecognitionLanguageDisplay();
}

function closeVoiceSettings() {
    document.getElementById('voice-settings-modal').classList.remove('show');
}

function updateSelectedVoice() {
    const select = document.getElementById('voice-select');
    state.voiceSettings.selectedVoice = select.value || null;
    saveVoiceSettings();
}

function updateSpeechRate(value) {
    state.voiceSettings.rate = parseFloat(value);
    document.getElementById('rate-value').textContent = value + 'x';
    saveVoiceSettings();
}

function updateSpeechPitch(value) {
    state.voiceSettings.pitch = parseFloat(value);
    document.getElementById('pitch-value').textContent = value;
    saveVoiceSettings();
}

function updateSpeechVolume(value) {
    state.voiceSettings.volume = parseFloat(value);
    document.getElementById('volume-value').textContent = Math.round(value * 100) + '%';
    saveVoiceSettings();
}

function updateContinuousListening() {
    const enabled = document.getElementById('continuous-listening-toggle').checked;
    if (enabled !== state.voiceSettings.continuousListening) {
        toggleContinuousMode();
    }
}

function updateAutoPlaySetting() {
    state.settings.autoPlay = document.getElementById('auto-play-setting-toggle').checked;
    document.getElementById('auto-play-toggle').checked = state.settings.autoPlay;
    saveSettings();
}

function updateVoiceNotifications() {
    state.settings.voiceNotifications = document.getElementById('voice-notifications-toggle').checked;
    saveSettings();
}

function updateRecognitionLanguageDisplay() {
    const langName = languageNames[state.selectedLanguageCode] || 'Not selected';
    const elem = document.getElementById('current-recognition-lang');
    if (elem) {
        elem.textContent = langName;
    }
}

function testVoice() {
    const messages = {
        'en-US': 'Hello! This is a test of the selected voice.',
        'es-ES': '¡Hola! Esta es una prueba de la voz seleccionada.',
        'fr-FR': 'Bonjour! Ceci est un test de la voix sélectionnée.',
        'de-DE': 'Hallo! Dies ist ein Test der ausgewählten Stimme.',
        'pt-PT': 'Olá! Este é um teste da voz selecionada.'
    };
    
    const message = messages[state.selectedLanguageCode] || messages['en-US'];
    speakText(message);
}

function resetVoiceSettings() {
    if (confirm('Reset all voice settings to defaults?')) {
        state.voiceSettings = {
            rate: 0.9,
            pitch: 1.0,
            volume: 1.0,
            selectedVoice: null,
            continuousListening: false
        };
        
        // Update UI
        document.getElementById('speech-rate').value = 0.9;
        document.getElementById('rate-value').textContent = '0.9x';
        document.getElementById('speech-pitch').value = 1.0;
        document.getElementById('pitch-value').textContent = '1.0';
        document.getElementById('speech-volume').value = 1.0;
        document.getElementById('volume-value').textContent = '100%';
        document.getElementById('voice-select').value = '';
        document.getElementById('continuous-listening-toggle').checked = false;
        
        // Update continuous mode button
        const btn = document.getElementById('continuous-mode-btn');
        btn.classList.remove('recording');
        btn.style.background = '';
        
        saveVoiceSettings();
        addSystemMessage('Voice settings reset to defaults');
    }
}

function toggleAutoPlay() {
    state.settings.autoPlay = document.getElementById('auto-play-toggle').checked;
    document.getElementById('auto-play-setting-toggle').checked = state.settings.autoPlay;
    saveSettings();
}

// ==================== NOTIFICATION SOUNDS ====================
function playNotificationSound(type) {
    // Using Web Audio API to generate simple tones
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'error') {
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }
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
        document.getElementById('auto-play-toggle').checked = state.settings.autoPlay;
        document.body.classList.toggle('light-theme', !state.settings.darkMode);
    }
}

function saveSettings() {
    localStorage.setItem('languageTutorSettings', JSON.stringify(state.settings));
}

function loadVoiceSettings() {
    const saved = localStorage.getItem('languageTutorVoiceSettings');
    if (saved) {
        state.voiceSettings = { ...state.voiceSettings, ...JSON.parse(saved) };
        
        // Apply to UI when modal opens
        setTimeout(() => {
            document.getElementById('speech-rate').value = state.voiceSettings.rate;
            document.getElementById('rate-value').textContent = state.voiceSettings.rate + 'x';
            document.getElementById('speech-pitch').value = state.voiceSettings.pitch;
            document.getElementById('pitch-value').textContent = state.voiceSettings.pitch;
            document.getElementById('speech-volume').value = state.voiceSettings.volume;
            document.getElementById('volume-value').textContent = Math.round(state.voiceSettings.volume * 100) + '%';
        }, 100);
    }
}

function saveVoiceSettings() {
    localStorage.setItem('languageTutorVoiceSettings', JSON.stringify(state.voiceSettings));
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
