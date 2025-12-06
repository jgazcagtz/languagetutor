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

    // Default Cartesia voice IDs (Example IDs - these should be replaced with actual IDs from Cartesia)
    // I am using some generic/placeholder IDs or names that Cartesia might support or resolving them.
    // Ideally, we'd query Cartesia's voices endpoint, but for performance, we'll map them here.
    const languageVoiceMapping = {
        'English': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e', // Example: 'Barbershop Man' or similar Sonic English voice
        'Spanish': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e', // Sonic Multilingual
        'French': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e', 
        'German': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e', 
        'Portuguese': 'a0e99841-438c-4a64-b6d5-50a3118d0c3e' 
    };
    
    // Note: Sonic Multilingual (a0e99841-438c-4a64-b6d5-50a3118d0c3e) handles multiple languages.
    // For specific voices, we should allow passing a voice ID.
    
    const selectedVoiceId = voice && voice !== 'auto' 
        ? voice 
        : (languageVoiceMapping[language] || 'a0e99841-438c-4a64-b6d5-50a3118d0c3e');

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
                language: language ? language.toLowerCase().substring(0, 2) : 'en' // Pass language code if needed by the model
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

