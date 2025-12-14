module.exports = async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
    const { text, voice, language } = req.body;

    if (!CARTESIA_API_KEY) {
        console.error('CARTESIA_API_KEY is not set in environment variables');
        return res.status(500).json({ 
            error: 'Cartesia API key not configured. Please set CARTESIA_API_KEY environment variable.' 
        });
    }

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Valid text is required' });
    }

    // Default Cartesia voice IDs (Using known stable public voices)
    const languageVoiceMapping = {
        'English': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e', // Sonic Multilingual
        'Spanish': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e',
        'French': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e',
        'German': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e',
        'Portuguese': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e' 
    };
    
    // Use a0e99841-438c-4a64-b6d5-50a3118d0c3e (Sonic Multilingual) as the reliable default
    // Note: When using sonic-multilingual model, we must use a voice ID compatible with it.
    // The ID a0e99841-438c-4a64-b6d5-50a3118d0c3e is a safe default.
    const selectedVoiceId = voice && voice !== 'auto' 
        ? voice 
        : (languageVoiceMapping[language] || 'a0e99841-438c-4a64-b6d5-50a3118d0c3e');

    const languageCodeMapping = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Portuguese': 'pt',
        'Chinese': 'zh',
        'Japanese': 'ja'
    };

    const targetLanguage = languageCodeMapping[language] || 'en';

    try {
        const response = await fetch('https://api.cartesia.ai/tts/bytes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': CARTESIA_API_KEY,
                'Cartesia-Version': '2024-06-10'
            },
            body: JSON.stringify({
                model_id: "sonic-multilingual", // Use multilingual model for flexibility
                transcript: text,
                voice: {
                    mode: "id",
                    id: selectedVoiceId
                },
                output_format: {
                    container: "mp3",
                    encoding: "mp3",
                    sample_rate: 44100
                },
                language: targetLanguage
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cartesia TTS API Error:', errorText);
            return res.status(response.status).json({ 
                error: `Cartesia API error: ${errorText}` 
            });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        res.status(200).json({
            audio: base64Audio,
            format: 'mp3',
            voice: selectedVoiceId
        });

    } catch (error) {
        console.error('Error in Cartesia TTS function:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

