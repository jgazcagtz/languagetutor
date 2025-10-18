module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const { text, voice = 'nova', language } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // Map languages to most appropriate OpenAI voices for natural tutoring
    const languageVoiceMapping = {
        'English': 'nova',      // Warm, friendly female voice - great for teaching
        'Spanish': 'shimmer',   // Clear, articulate - excellent for Spanish
        'French': 'alloy',      // Neutral, professional - works well for French
        'German': 'echo',       // Clear male voice - good for German pronunciation
        'Portuguese': 'fable'   // Expressive British accent - works for Portuguese
    };

    // Select appropriate voice based on language, or use provided voice
    const selectedVoice = voice === 'auto' 
        ? (languageVoiceMapping[language] || 'nova')
        : voice;

    try {
        // Call OpenAI Text-to-Speech API
        const openAIResponse = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'tts-1-hd', // High quality model for natural sound
                voice: selectedVoice,
                input: text,
                speed: 0.95, // Slightly slower for language learning clarity
                response_format: 'mp3'
            })
        });

        if (!openAIResponse.ok) {
            const errorData = await openAIResponse.json().catch(() => ({}));
            console.error('OpenAI TTS API Error:', errorData);
            
            if (openAIResponse.status === 429) {
                return res.status(429).json({ 
                    error: 'TTS service is busy. Please try again in a moment.' 
                });
            } else if (openAIResponse.status === 401) {
                return res.status(500).json({ 
                    error: 'TTS authentication error. Please contact support.' 
                });
            } else {
                return res.status(openAIResponse.status).json({ 
                    error: 'Error generating speech. Please try again.' 
                });
            }
        }

        // Get the audio buffer
        const audioBuffer = await openAIResponse.arrayBuffer();
        
        // Convert to base64 for easy transmission
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        res.status(200).json({ 
            audio: base64Audio,
            format: 'mp3',
            voice: selectedVoice
        });
    } catch (error) {
        console.error('Error in TTS function:', error);
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Unable to connect to TTS service. Please check your connection.' 
            });
        }
        
        res.status(500).json({ 
            error: 'An error occurred while generating speech. Please try again.' 
        });
    }
};

