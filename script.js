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
        rate: 0.95,
        volume: 1.0,
        selectedVoice: 'auto', // OpenAI voice: auto, nova, shimmer, alloy, echo, fable, onyx
        continuousListening: false
    },
    audioCache: new Map(), // Cache audio to avoid regenerating
    currentAudio: null, // Track currently playing audio
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
    'en-US': {
        student: [
            "How do I introduce myself in English?",
            "Teach me common greetings",
            "Help me with verb tenses",
            "What are some useful phrases for travel?"
        ],
        teacher: [
            "Create a beginner lesson plan for introducing yourself",
            "Generate practice exercises for present tense",
            "Suggest activities for teaching common phrases",
            "What are common pronunciation mistakes to watch for?"
        ]
    },
    'es-ES': {
        student: [
            "¿Cómo me presento en español?",
            "Ayúdame con los verbos irregulares",
            "Enséñame frases comunes para viajar",
            "Explica el subjuntivo"
        ],
        teacher: [
            "Crea un plan de lección para enseñar el subjuntivo",
            "Genera ejercicios para verbos irregulares",
            "Sugiere actividades interactivas para principiantes",
            "¿Cuáles son los errores comunes de estudiantes anglófonos?"
        ]
    },
    'fr-FR': {
        student: [
            "Comment me présenter en français?",
            "Aidez-moi avec les verbes",
            "Apprenez-moi les salutations courantes",
            "Expliquez les pronoms"
        ],
        teacher: [
            "Créez un plan de leçon pour les pronoms",
            "Générez des exercices de conjugaison",
            "Suggérez des activités pour enseigner les salutations",
            "Quelles sont les erreurs courantes à surveiller?"
        ]
    },
    'de-DE': {
        student: [
            "Wie stelle ich mich auf Deutsch vor?",
            "Helfen Sie mir mit den Artikeln",
            "Lehren Sie mich gängige Redewendungen",
            "Erklären Sie die Fälle"
        ],
        teacher: [
            "Erstellen Sie einen Unterrichtsplan für Artikel",
            "Generieren Sie Übungen für die Fälle",
            "Schlagen Sie Aktivitäten für Anfänger vor",
            "Was sind häufige Fehler englischsprachiger Lernender?"
        ]
    },
    'pt-PT': {
        student: [
            "Como me apresento em português?",
            "Ajude-me com os verbos",
            "Ensine-me saudações comuns",
            "Explique as conjugações"
        ],
        teacher: [
            "Crie um plano de aula para conjugações verbais",
            "Gere exercícios de prática",
            "Sugira atividades interativas para iniciantes",
            "Quais são os erros comuns de estudantes?"
        ]
    }
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
    },
    teaching: {
        icon: 'fa-chalkboard-teacher',
        name: 'Teaching Studio',
        systemAddition: ' Act as an expert teaching assistant for language educators. Provide: lesson plan suggestions, exercise generation, teaching tips, cultural context notes, common student mistakes to watch for, pronunciation guides, differentiated instruction ideas, classroom activity suggestions, and professional teaching strategies. Help teachers create engaging, effective lessons.'
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
    setupTouchRippleEffects();
    setupSwipeGestures();
});

function initializeEventListeners() {
    // Use event delegation for language buttons to optimize memory
    document.querySelector('.language-grid')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.language-btn');
        if (btn) {
            selectLanguage(btn.dataset.lang, btn.dataset.name);
        }
    });

    // Sidebar toggle for mobile
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('active');
    });

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Optimized sidebar close using single event listener
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 968 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Enter key to send (optimized to check for actual content)
    const userInput = document.getElementById('user-input');
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (userInput.value.trim()) {
                sendMessage();
            }
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
            state.conversationHistory = [];
            document.getElementById('chat-log').innerHTML = '';
        } else {
            return;
        }
    }

    // Show initial greeting ONLY if chat is empty
    const chatLog = document.getElementById('chat-log');
    if (chatLog.children.length === 0) {
        addBotMessage(`Great! Let's learn ${langName} together. How can I help you today?`);
    }
}

function showConversationStarters() {
    const startersContainer = document.getElementById('conversation-starters');
    const starterGrid = document.getElementById('starter-grid');

    if (!state.selectedLanguageCode) return;

    starterGrid.innerHTML = '';
    
    // Determine which starters to show based on current mode
    const starterType = state.currentMode === 'teaching' ? 'teacher' : 'student';
    const startersData = conversationStarters[state.selectedLanguageCode];
    const starters = startersData ? (startersData[starterType] || startersData.student || []) : [];

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

    // Update conversation starters based on mode
    showConversationStarters();

    // Add system message with mode-specific info
    let modeMessage = `Switched to ${config.name}`;
    if (mode === 'teaching') {
        modeMessage += ' - Your AI teaching assistant is ready to help you create engaging lessons!';
    }
    addSystemMessage(modeMessage);
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

    if (!message) {
        // Shake input if empty
        userInput.classList.add('shake');
        setTimeout(() => userInput.classList.remove('shake'), 500);
        return;
    }

    if (!state.selectedLanguageCode) {
        alert('Please select a language first!');
        return;
    }

    // Send button animation
    const sendBtn = document.querySelector('.send-btn');
    sendBtn.classList.add('sending');
    setTimeout(() => sendBtn.classList.remove('sending'), 600);

    // Clear input
    if (!messageText) {
        userInput.value = '';
    }

    // Add user message to UI with animation
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

        // Text-to-speech with OpenAI
        if (state.settings.autoPlay && state.settings.ttsEnabled) {
            await speakText(data.response);
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
    messageDiv.className = 'message user-message slide-in-right';

    const timestamp = state.settings.timestampsEnabled ? getCurrentTime() : '';

    messageDiv.innerHTML = `
        <div class="message-avatar float">👤</div>
        <div class="message-content touch-ripple">
            <div class="message-text">${escapeHtml(text)}</div>
            ${timestamp ? `
                <div class="message-footer">
                    <span class="message-time">${timestamp}</span>
                    <div class="message-actions">
                        <button class="message-action-btn touch-ripple" onclick="copyMessage(this)" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    chatLog.appendChild(messageDiv);
    scrollToBottom();
    
    // Create particle effect
    createParticles(messageDiv);
}

function addBotMessage(text) {
    const chatLog = document.getElementById('chat-log');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message slide-in-left';

    const timestamp = state.settings.timestampsEnabled ? getCurrentTime() : '';

    messageDiv.innerHTML = `
        <div class="message-avatar float">🤖</div>
        <div class="message-content touch-ripple">
            <div class="message-text">${formatBotMessage(text)}</div>
            ${timestamp ? `
                <div class="message-footer">
                    <span class="message-time">${timestamp}</span>
                    <div class="message-actions">
                        <button class="message-action-btn touch-ripple" onclick="copyMessage(this)" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action-btn touch-ripple" onclick="speakMessage(this)" title="Speak">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    chatLog.appendChild(messageDiv);
    scrollToBottom();
    
    // Create particle effect
    createParticles(messageDiv);
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
        button.classList.add('success-check');
        
        // Show success feedback
        showToast('Copied to clipboard!', 'success');
        
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.classList.remove('success-check');
        }, 2000);
    }).catch(err => {
        showToast('Failed to copy', 'error');
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

// ==================== OPENAI TEXT-TO-SPEECH ====================
async function speakText(text) {
    if (!state.settings.ttsEnabled) {
        return;
    }

    // Sanitize text to avoid cache misses from minor formatting differences
    const sanitizedText = text.trim().substring(0, 500); // Limit to 500 chars for TTS

    // Stop any currently playing audio
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
    }

    // Check cache first (use sanitized text for consistent caching)
    const cacheKey = `${sanitizedText}_${state.voiceSettings.selectedVoice}_${state.selectedLanguage}`;
    let audioData = state.audioCache.get(cacheKey);

    if (!audioData) {
        try {
            // Call our TTS API endpoint
            const response = await fetch('https://languagetutor.vercel.app/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sanitizedText,
                    voice: state.voiceSettings.selectedVoice,
                    language: state.selectedLanguage
                })
            });

            if (!response.ok) {
                console.warn('TTS API returned error status:', response.status);
                throw new Error('TTS service unavailable');
            }

            const data = await response.json();
            
            if (!data.audio) {
                throw new Error('Invalid TTS response');
            }
            
            audioData = data.audio;
            
            // Cache the audio (LRU cache with size limit)
            if (state.audioCache.size >= 20) {
                const firstKey = state.audioCache.keys().next().value;
                state.audioCache.delete(firstKey);
            }
            state.audioCache.set(cacheKey, audioData);
        } catch (error) {
            console.error('TTS Error:', error);
            // Fallback to browser TTS if OpenAI fails
            fallbackBrowserTTS(sanitizedText);
            return;
        }
    }

    // Play the audio
    try {
        const audioBlob = base64ToBlob(audioData, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        state.currentAudio = new Audio(audioUrl);
        state.currentAudio.volume = state.voiceSettings.volume;
        state.currentAudio.playbackRate = state.voiceSettings.rate;
        
        // Cleanup URL after playing to prevent memory leaks
        state.currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            state.currentAudio = null;
        };
        
        // Handle playback errors
        state.currentAudio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            state.currentAudio = null;
            console.error('Audio playback error');
        };
        
        await state.currentAudio.play();
    } catch (error) {
        console.error('Audio playback error:', error);
        // Don't fallback on playback errors, just fail silently
    }
}

// Fallback to browser TTS if OpenAI fails
function fallbackBrowserTTS(text) {
    console.warn('Falling back to browser TTS - OpenAI TTS unavailable');
    
    if (!('speechSynthesis' in window)) {
        console.error('Browser TTS also unavailable');
        showToast('Text-to-speech unavailable', 'error');
        return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.voiceSettings.rate;
    utterance.volume = state.voiceSettings.volume;
    
    // Try to find a voice matching the selected language
    const voices = speechSynthesis.getVoices();
    if (state.selectedLanguageCode && voices.length > 0) {
        const voice = voices.find(v => v.lang === state.selectedLanguageCode) ||
                     voices.find(v => v.lang.startsWith(state.selectedLanguageCode?.split('-')[0]));
        if (voice) utterance.voice = voice;
    }
    
    // Show warning that we're using browser TTS
    showToast('Using browser voice (OpenAI TTS offline)', 'info');
    
            speechSynthesis.speak(utterance);
}

// Utility function to convert base64 to Blob
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

// Initialize OpenAI voices
function initializeVoices() {
    populateVoiceList();
}

function populateVoiceList() {
    const voiceSelect = document.getElementById('voice-select');
    if (!voiceSelect) return;
    
    // OpenAI TTS voices with descriptions
    const openAIVoices = [
        { value: 'auto', name: 'Auto (Best for Language)', description: 'Automatically selects the best voice for your learning language' },
        { value: 'nova', name: 'Nova', description: 'Warm, friendly female voice - excellent for teaching' },
        { value: 'shimmer', name: 'Shimmer', description: 'Clear, articulate female voice - great for pronunciation' },
        { value: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice - professional tutor style' },
        { value: 'echo', name: 'Echo', description: 'Clear male voice - good for deeper tones' },
        { value: 'fable', name: 'Fable', description: 'Expressive British accent - engaging storyteller' },
        { value: 'onyx', name: 'Onyx', description: 'Deep, authoritative male voice - formal instruction' }
    ];
    
    voiceSelect.innerHTML = '';
    
    openAIVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.value;
        option.textContent = `${voice.name} - ${voice.description}`;
        if (voice.value === state.voiceSettings.selectedVoice) {
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
    state.voiceSettings.selectedVoice = select.value || 'auto';
    
    // Clear audio cache when voice changes
    state.audioCache.clear();
    
    saveVoiceSettings();
}

function updateSpeechRate(value) {
    state.voiceSettings.rate = parseFloat(value);
    document.getElementById('rate-value').textContent = value + 'x';
    
    // Update current audio if playing
    if (state.currentAudio) {
        state.currentAudio.playbackRate = state.voiceSettings.rate;
    }
    
    saveVoiceSettings();
}

function updateSpeechVolume(value) {
    state.voiceSettings.volume = parseFloat(value);
    document.getElementById('volume-value').textContent = Math.round(value * 100) + '%';
    
    // Update current audio if playing
    if (state.currentAudio) {
        state.currentAudio.volume = state.voiceSettings.volume;
    }
    
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

async function testVoice() {
    const messages = {
        'en-US': 'Hello! I\'m your AI language tutor. I\'m here to help you learn and practice English with natural, clear pronunciation.',
        'es-ES': '¡Hola! Soy tu tutor de idiomas con inteligencia artificial. Estoy aquí para ayudarte a aprender y practicar español con pronunciación natural y clara.',
        'fr-FR': 'Bonjour! Je suis votre tuteur de langue avec intelligence artificielle. Je suis là pour vous aider à apprendre et à pratiquer le français avec une prononciation naturelle et claire.',
        'de-DE': 'Hallo! Ich bin Ihr KI-Sprachtutor. Ich bin hier, um Ihnen beim Lernen und Üben von Deutsch mit natürlicher, klarer Aussprache zu helfen.',
        'pt-PT': 'Olá! Sou o seu tutor de idiomas com inteligência artificial. Estou aqui para ajudá-lo a aprender e praticar português com pronúncia natural e clara.'
    };
    
    const message = messages[state.selectedLanguageCode] || messages['en-US'];
    await speakText(message);
}

function resetVoiceSettings() {
    if (confirm('Reset all voice settings to defaults?')) {
        state.voiceSettings = {
            rate: 0.95,
            volume: 1.0,
            selectedVoice: 'auto',
            continuousListening: false
        };
        
        // Clear audio cache
        state.audioCache.clear();
        
        // Update UI
        document.getElementById('speech-rate').value = 0.95;
        document.getElementById('rate-value').textContent = '0.95x';
        document.getElementById('speech-volume').value = 1.0;
        document.getElementById('volume-value').textContent = '100%';
        document.getElementById('voice-select').value = 'auto';
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
        
        // Ensure selectedVoice is set to a valid OpenAI voice
        if (!state.voiceSettings.selectedVoice || 
            !['auto', 'nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx'].includes(state.voiceSettings.selectedVoice)) {
            state.voiceSettings.selectedVoice = 'auto';
        }
        
        // Apply to UI when modal opens
        setTimeout(() => {
            document.getElementById('speech-rate').value = state.voiceSettings.rate;
            document.getElementById('rate-value').textContent = state.voiceSettings.rate + 'x';
            document.getElementById('speech-volume').value = state.voiceSettings.volume;
            document.getElementById('volume-value').textContent = Math.round(state.voiceSettings.volume * 100) + '%';
            document.getElementById('voice-select').value = state.voiceSettings.selectedVoice;
        }, 100);
    }
}

function saveVoiceSettings() {
    localStorage.setItem('languageTutorVoiceSettings', JSON.stringify(state.voiceSettings));
}

// ==================== CONVERSATION PERSISTENCE ====================
// Debounced save to reduce localStorage writes
const saveConversationHistory = debounce(() => {
    if (state.selectedLanguageCode) {
        const key = `conversation_${state.selectedLanguageCode}`;
        try {
            localStorage.setItem(key, JSON.stringify(state.conversationHistory));
        } catch (error) {
            console.error('Failed to save conversation history:', error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                // Clear old conversations to make space
                const keys = Object.keys(localStorage).filter(k => k.startsWith('conversation_'));
                if (keys.length > 1) {
                    localStorage.removeItem(keys[0]);
                    // Try again
                    localStorage.setItem(key, JSON.stringify(state.conversationHistory));
                }
            }
        }
    }
}, 500);

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
// Optimized modal click handling (using event delegation)
document.addEventListener('click', (e) => {
    // Close modal when clicking outside
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
    // Prevent propagation from modal content (event delegation)
    else if (e.target.closest('.modal-content')) {
        e.stopPropagation();
    }
});

// ==================== COOL ANIMATIONS & EFFECTS ====================

// Particle effect generator (optimized with reduced particle count on mobile)
function createParticles(element) {
    // Skip particles on slow devices or when user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    
    const rect = element.getBoundingClientRect();
    const particleCount = window.innerWidth < 640 ? 3 : 5; // Fewer particles on mobile
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        particle.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
        particle.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 2000);
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} slide-in-right`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Long press detection for mobile
function setupLongPress(element, callback) {
    let pressTimer;
    
    element.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            callback(e);
            element.classList.add('long-press');
            setTimeout(() => element.classList.remove('long-press'), 300);
        }, 500);
    });
    
    element.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });
    
    element.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });
}

// Smooth scroll with easing
// Debounce helper to prevent excessive function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized smooth scroll with performance considerations
function smoothScrollTo(element, duration = 500) {
    // Use native smooth scrolling if available (better performance)
    if ('scrollBehavior' in document.documentElement.style) {
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
        return;
    }
    
    // Fallback to custom animation
    const start = element.scrollTop;
    const end = element.scrollHeight;
    const change = end - start;
    const startTime = performance.now();
    
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutQuad(progress);
        
        element.scrollTop = start + change * eased;
        
        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }
    
    requestAnimationFrame(animateScroll);
}

// Enhanced scroll to bottom with smooth animation
const scrollToBottom = debounce(() => {
    const chatArea = document.getElementById('chat-area');
    smoothScrollTo(chatArea, 300);
}, 100);

// Confetti effect for celebrations (optimized for performance)
function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const confettiCount = window.innerWidth < 640 ? 30 : 50; // Fewer on mobile
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.opacity = '1';
        confetti.style.transform = 'rotate(0deg)';
        confetti.style.transition = 'all 3s ease-out';
        confetti.style.zIndex = '10000';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.style.top = window.innerHeight + 'px';
            confetti.style.left = (parseInt(confetti.style.left) + (Math.random() - 0.5) * 200) + 'px';
            confetti.style.opacity = '0';
            confetti.style.transform = 'rotate(' + (Math.random() * 720) + 'deg)';
        }, 50);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Haptic feedback for mobile (if supported)
function triggerHaptic(type = 'light') {
    if ('vibrate' in navigator) {
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30,
            success: [10, 50, 10],
            error: [20, 100, 20]
        };
        navigator.vibrate(patterns[type] || 10);
    }
}

// Add touch ripple effect to buttons
function setupTouchRippleEffects() {
    document.querySelectorAll('button, .language-btn, .action-btn').forEach(button => {
        button.classList.add('touch-ripple');
    });
}

// ==================== SWIPE GESTURES FOR MOBILE ====================
function setupSwipeGestures() {
    // Only setup on mobile devices to save resources
    if (window.innerWidth > 968) {
        return;
    }
    
    const sidebar = document.getElementById('sidebar');
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true }); // Passive for better scroll performance
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = Math.abs(touchEndY - touchStartY);
        
        // Only trigger if horizontal swipe (not vertical scroll)
        if (swipeDistanceY > 50) return;
        
        // Swipe right to open sidebar (from left edge)
        if (swipeDistanceX > swipeThreshold && touchStartX < 50) {
            sidebar.classList.add('active');
            triggerHaptic('light');
        }
        
        // Swipe left to close sidebar
        if (swipeDistanceX < -swipeThreshold && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            triggerHaptic('light');
        }
    }
}

