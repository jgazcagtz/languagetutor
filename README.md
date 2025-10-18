# 🌍 Language Tutor™ - AI-Powered Language Learning

A state-of-the-art language learning application powered by GPT-4, featuring modern UI/UX design, multiple learning modes, intelligent conversation management, and professional OpenAI voices.

![Language Tutor](https://img.shields.io/badge/Version-2.1-purple)
![License](https://img.shields.io/badge/License-MIT-blue)
![AI](https://img.shields.io/badge/Powered%20by-GPT--4-green)

## 🚀 Quick Start

1. **Landing Page**: Open `landing.html` - Beautiful landing page with guided tutorial
2. **Main App**: Open `index.html` - Jump straight to the language tutor app

The landing page provides an interactive onboarding experience!

## 🚀 Features

### 🎯 Core Capabilities
- **5 Supported Languages**: English, Spanish, French, German, and Portuguese
- **AI-Powered Tutoring**: Advanced GPT-4 integration with contextual understanding
- **Conversation History**: Maintains context across the entire conversation
- **Advanced Voice Integration**: Professional speech recognition with real-time visualization
- **Smart TTS Engine**: Customizable voice, speed, pitch, and volume controls
- **Offline Persistence**: Conversations saved locally, resume anytime

### 🎨 Learning Modes

1. **Free Conversation** 💬
   - Practice natural conversations
   - Real-time feedback and corrections
   - Contextual responses

2. **Grammar Help** 📖
   - Detailed grammar explanations
   - Examples and usage patterns
   - Progressive learning

3. **Vocabulary Builder** 📝
   - Learn new words in context
   - Synonyms and usage examples
   - Practical application

4. **Practice Exercises** 🎯
   - Interactive quizzes
   - Fill-in-the-blank exercises
   - Immediate feedback

5. **Level Assessment** 📊
   - Proficiency evaluation
   - CEFR level estimation (A1-C2)
   - Personalized recommendations

6. **Teaching Studio** 👨‍🏫 *NEW!*
   - **For Language Educators & Teachers**
   - Generate comprehensive lesson plans
   - Create custom exercises and worksheets
   - Get teaching methodology tips
   - Access cultural context information
   - Identify common student mistakes
   - Receive pronunciation teaching guides
   - Plan differentiated instruction
   - Generate classroom activities
   - Professional teaching strategies
   - Language-specific conversation starters for educators

### 🎤 Advanced Voice Features

#### Voice Recognition
- **Real-time Audio Visualization**: Beautiful waveform display while recording
- **Voice Level Indicator**: Visual feedback of microphone input volume
- **Recording Timer**: Track your recording duration
- **Continuous Listening Mode**: Hands-free conversation practice
- **Keyboard Shortcuts**: Quick access with `Ctrl+Space`
- **Multi-language Support**: Automatic language switching
- **Error Handling**: Clear feedback for recognition issues

#### OpenAI Text-to-Speech (Premium Quality)
- **Natural AI Voices**: 6 professional voices powered by OpenAI TTS-1-HD
- **Voice Selection**: Choose from Nova, Shimmer, Alloy, Echo, Fable, or Onyx
- **Auto Mode**: Intelligently selects the best voice for your learning language
- **Speech Rate**: Adjustable from 0.5x to 2x speed (default: 0.95x for learning)
- **Volume Control**: Fine-tune audio output
- **Smart Caching**: Audio responses cached for instant replay
- **Auto-play Responses**: Optional automatic voice responses
- **Voice Notifications**: Audio feedback for actions
- **Fallback Support**: Graceful fallback to browser TTS if needed

#### Professional Recording Interface
- **Animated Recording Panel**: Sleek UI when listening
- **Pulsing Indicator**: Visual recording status
- **Cancel/Stop Controls**: Full control over recording
- **Audio Waveform Canvas**: Real-time frequency visualization
- **Volume Level Bar**: Monitor input sensitivity

### 💎 Modern UI/UX Features

#### Visual Design
- **Animated Background**: Beautiful gradient orbs with floating animation
- **Glass Morphism**: Modern frosted glass effects with backdrop blur
- **Smooth Animations**: Thoughtful transitions and micro-interactions
- **Responsive Layout**: Perfect experience on mobile, tablet, and desktop
- **Dark/Light Themes**: Toggle between themes based on preference

#### User Experience
- **Conversation Starters**: Quick-start prompts for each language
- **Typing Indicators**: Visual feedback while AI processes responses
- **Message Actions**: Copy text, replay audio, timestamp display
- **Mobile-Optimized**: Collapsible sidebar, touch-friendly controls
- **Keyboard Shortcuts**: Press Enter to send messages
- **Smart Scrolling**: Auto-scroll to latest messages

#### Advanced Features
- **Message Formatting**: Supports bold, italic, and code formatting
- **Copy to Clipboard**: One-click message copying
- **Professional Voice Suite**: Complete recording studio experience
- **Language Switching**: Seamlessly switch between languages
- **Session Management**: Clear chat, restart conversations
- **Dual Settings Panels**: General settings + dedicated voice settings
- **Keyboard Shortcuts**: Power user productivity features

## 🛠️ Technical Stack

### Frontend
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Modern features including Grid, Flexbox, animations
- **Vanilla JavaScript**: No framework dependencies, pure performance
- **Font Awesome**: Beautiful icons throughout the interface
- **Google Fonts**: Inter & Space Grotesk for professional typography

### Backend
- **Node.js**: Serverless function architecture
- **OpenAI GPT-4**: State-of-the-art language model
- **Vercel**: Serverless deployment platform

### APIs & Services
- **Web Speech API**: Voice recognition for input
- **OpenAI GPT-4 API**: Advanced chat completions with context
- **OpenAI TTS API**: Premium text-to-speech (TTS-1-HD model)
- **LocalStorage API**: Conversation and settings persistence
- **Web Audio API**: Real-time audio visualization
- **MediaStream API**: Microphone access for waveform display

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 **Mobile**: 320px - 640px
- 📱 **Tablet**: 641px - 968px  
- 💻 **Desktop**: 969px and above

### Mobile Optimizations
- **Collapsible sidebar** navigation with smooth animations
- **Swipe gestures** - Swipe right to open, left to close sidebar
- **Touch-optimized controls** with larger tap targets
- **Adaptive input area** - stacked voice controls on mobile
- **Optimized footer** - vertical layout for better readability
- **Smaller button sizes** for mobile (40px vs 44px)
- **Compact mode indicator** with adjusted font sizes
- **Full-width recording buttons** for easy touch access
- **Responsive conversation starters** - single column grid
- **Adaptive typography** - scaled down for smaller screens
- **Optimized spacing** - reduced padding for mobile
- **Voice panel mobile layout** - stacked controls
- **Haptic feedback** - Vibration on key interactions

## 🎨 Design System

### Color Palette
```css
Primary Gradient: #667eea → #764ba2 (Purple)
Secondary Gradient: #f093fb → #f5576c (Pink)
Accent Gradient: #4facfe → #00f2fe (Blue)
Success Gradient: #43e97b → #38f9d7 (Green)
```

### Typography
- **Headings**: Space Grotesk (Bold, 700)
- **Body**: Inter (Regular, 400-700)
- **Monospace**: System monospace for code

### Spacing Scale
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- OpenAI API key
- Modern web browser with Speech API support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/languagetutor.git
   cd languagetutor
   ```

2. **Set up environment variables**
   Create a `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Deploy to Vercel**
   ```bash
   vercel deploy
   ```

### Local Development

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Run locally**
   ```bash
   vercel dev
   ```

3. **Open in browser**
   - Landing page: `http://localhost:3000/landing.html`
   - Main app: `http://localhost:3000/index.html`

### Quick Test (No Server Needed)

You can also open the HTML files directly in your browser:
- `landing.html` - For the landing page experience
- `index.html` - For direct access to the app

Note: For full functionality (OpenAI TTS), you'll need to deploy to Vercel or run locally with environment variables.

## 📖 Usage Guide

### Getting Started
1. **Select a Language**: Click on your target language from the sidebar
2. **Choose a Mode**: Select from 5 learning modes based on your goals
3. **Start Learning**: Type a question or use conversation starters
4. **Use Voice**: Click the microphone or press `Ctrl+Space` to practice speaking

### Voice Features Guide

#### Basic Voice Input
1. Click the microphone button or press `Ctrl+Space`
2. Speak clearly in your selected language
3. The recording panel shows real-time audio visualization
4. Click "Stop & Send" or let it auto-detect silence
5. Your speech is converted to text and sent automatically

#### Continuous Listening Mode
1. Click the circular arrow icon next to the microphone
2. The system will continuously listen after each response
3. Perfect for extended conversation practice
4. Click again to disable

#### Voice Settings
1. Click the sliders icon to open voice settings
2. **Choose Your Voice**: Select from 6 OpenAI AI voices:
   - **Auto**: Automatically selects best voice for your language
   - **Nova**: Warm, friendly female - excellent for teaching
   - **Shimmer**: Clear, articulate female - great for pronunciation
   - **Alloy**: Neutral, balanced - professional tutor style
   - **Echo**: Clear male - good for deeper tones
   - **Fable**: Expressive British - engaging storyteller
   - **Onyx**: Deep, authoritative male - formal instruction
3. **Adjust Speed**: 0.5x (slow) to 2x (fast) - default 0.95x for learning
4. **Set Volume**: Control audio output level (0-100%)
5. **Test Voice**: Preview with natural language-specific sample
6. **Enable Features**: Auto-play, continuous mode, voice notifications

#### Keyboard Shortcuts
- `Enter`: Send message
- `Ctrl+Space`: Start/stop voice recording
- `Escape`: Cancel voice recording

#### Mobile Gestures
- **Swipe right** from left edge: Open sidebar
- **Swipe left** on sidebar: Close sidebar
- **Tap outside** sidebar: Close sidebar
- **Long press** ready for future features

### Tips for Best Results
- Be specific with your questions
- Practice regularly for best retention
- Use voice features to improve pronunciation
- Try different learning modes
- Don't hesitate to ask for clarification

### Example Interactions

**Conversation Mode**
```
You: "How do I introduce myself in Spanish?"
Tutor: "¡Hola! To introduce yourself in Spanish, you can say:
- 'Me llamo [name]' - My name is [name]
- 'Soy [name]' - I am [name]
- 'Mucho gusto' - Nice to meet you

For example: 'Hola, me llamo María. Mucho gusto.'"
```

**Grammar Mode**
```
You: "Explain the subjunctive mood in Spanish"
Tutor: "The subjunctive (el subjuntivo) expresses doubt, desire, 
or uncertainty. It's used when..."
```

## 🔧 Configuration

### Settings
Access settings via the gear icon in the header:

- **Text-to-Speech**: Enable/disable voice responses
- **Timestamps**: Show/hide message timestamps
- **Dark Mode**: Toggle between dark and light themes

### Voice Settings Storage
All voice preferences are saved to localStorage:
- Speech rate and volume
- Selected OpenAI voice (auto, nova, shimmer, alloy, echo, fable, onyx)
- Continuous listening state
- Auto-play preferences
- Voice notification settings
- Audio cache for instant playback

### Customization

Modify CSS variables in `style.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --bg-primary: #0f0f1e;
    --text-primary: #ffffff;
    /* ... more variables */
}
```

## 🌟 Key Improvements Over Previous Version

### Latest Updates (V2.1.1)
- ✅ **Landing Page** - Stunning landing page with CTA
- ✅ **Interactive Tutorial** - 4-step guided onboarding
- ✅ **Fixed OpenAI TTS** - Prevents fallback to browser voices
- ✅ **Fixed Language Selection** - No double prompts
- ✅ **Better Error Handling** - Toast notifications for voice issues

### Previous Updates (V2.1)
- ✅ **Teaching Studio Mode** - Complete educator toolkit
- ✅ **Mobile Responsive Input** - Optimized typing area for mobile
- ✅ **Smart Conversation Starters** - Adapts to student/teacher mode
- ✅ **Mode-Specific Badge** - "NEW" indicator for Teaching Studio
- ✅ **Enhanced Mobile UX** - Stacked controls, better spacing
- ✅ **Donate Button** - Animated Buy Me a Coffee integration
- ✅ **Advanced Animations** - Touch ripples, particles, confetti

### Visual Enhancements
- ✅ Complete UI redesign with modern aesthetics
- ✅ Animated gradient background
- ✅ Glass morphism effects
- ✅ Smooth animations and transitions
- ✅ Professional typography
- ✅ Improved color scheme
- ✅ Special Teaching Studio styling (green gradient when active)

### UX Improvements
- ✅ Conversation history with context
- ✅ Multiple learning modes
- ✅ Conversation starters for quick start
- ✅ Better message formatting
- ✅ Copy and replay message actions
- ✅ Typing indicators
- ✅ Improved mobile experience
- ✅ Dual settings panels (General + Voice)
- ✅ Theme switching
- ✅ Keyboard shortcuts
- ✅ Professional voice interface

### Technical Improvements
- ✅ Conversation context management
- ✅ LocalStorage persistence (conversations + voice settings)
- ✅ Better error handling with user-friendly messages
- ✅ Optimized API usage
- ✅ Mode-specific AI instructions
- ✅ Enhanced system prompts
- ✅ Better code organization
- ✅ Web Audio API integration for visualization
- ✅ Canvas-based real-time waveform rendering
- ✅ OpenAI TTS-1-HD integration
- ✅ Intelligent audio caching system
- ✅ Continuous listening architecture
- ✅ Notification sound system
- ✅ Graceful fallback mechanisms

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow existing code style
2. Test on multiple browsers
3. Ensure responsive design works
4. Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Font Awesome for icons
- Google Fonts for typography
- Vercel for hosting platform

## 📧 Support

For support, email support@learnwg.com or visit [LearnWG](https://learnwg.vercel.app/)

## 🗺️ Roadmap

### Voice & Audio
- [x] OpenAI TTS integration with natural voices
- [x] Real-time audio visualization
- [x] Intelligent audio caching
- [ ] Voice activity detection (VAD)
- [ ] Pronunciation scoring and feedback
- [ ] Audio playback controls with waveform
- [ ] Voice recording history and playback
- [ ] Custom wake words for hands-free activation
- [ ] Accent selection per language
- [ ] Voice cloning for personalized tutoring

### Learning Features
- [x] Teaching Studio for educators
- [x] Mode-specific conversation starters
- [ ] User authentication and profiles
- [ ] Progress tracking and analytics
- [ ] Flashcard system with spaced repetition
- [ ] Gamification elements and achievements
- [ ] Social features (practice with peers)
- [ ] More languages (Italian, Japanese, Chinese, etc.)
- [ ] Student progress reports for teachers
- [ ] Classroom management features
- [ ] Assignment creation and tracking

### Technical
- [ ] Mobile app (React Native)
- [ ] Offline mode with cached lessons
- [ ] PWA support with offline capabilities
- [ ] WebRTC for real-time practice sessions
- [ ] Advanced speech analytics

---

**Made with ❤️ by LearnWG** | Powered by GPT-4

