module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
    const { text, voice, language } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Valid text is required' });
    }

    // Default Cartesia voice IDs (Using known stable public voices)
    const languageVoiceMapping = {
        'English': '694f9389-1f49-4641-ba63-1568b7e5742b', // Barbershop Man (Standard)
        'Spanish': '694f9389-1f49-4641-ba63-1568b7e5742b', // Sonic Multilingual supports this ID
        'French': '694f9389-1f49-4641-ba63-1568b7e5742b', 
        'German': '694f9389-1f49-4641-ba63-1568b7e5742b', 
        'Portuguese': '694f9389-1f49-4641-ba63-1568b7e5742b' 
    };
    
    // Note: Sonic Multilingual (a0e99841-438c-4a64-b6d5-50a3118d0c3e) was a placeholder.
    // 694f9389-1f49-4641-ba63-1568b7e5742b is a widely compatible voice for Sonic.
    
    const selectedVoiceId = voice && voice !== 'auto' 
        ? voice 
        : (languageVoiceMapping[language] || '694f9389-1f49-4641-ba63-1568b7e5742b');

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

