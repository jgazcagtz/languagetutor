const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // OpenAI API Key
    const { message, max_tokens } = req.body;

    const systemPrompt = 'You are a professional multilingual language tutor specializing in English, Spanish, French, German, and Portuguese. Answer questions about grammar, vocabulary, pronunciation, and language usage in these languages, using clear examples, practical advice, and encouragement. Adapt your responses to the user\'s language, and provide examples that reflect cultural nuances and commonly used phrases.';

    const defaultMaxTokens = 500;

    try {
        let botMessage;

        if (!message) {
            botMessage = 'Welcome to the Multilingual Language Tutor! I can help you learn English, Spanish, French, German, or Portuguese...';
        } else {
            // Make a request to OpenAI API for text response
            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: max_tokens || defaultMaxTokens,
                    temperature: 0.7
                })
            });

            if (!openAIResponse.ok) {
                const errorData = await openAIResponse.json();
                console.error('OpenAI API Error:', errorData);
                return res.status(openAIResponse.status).json({ error: errorData.error.message || 'Error from OpenAI API' });
            }

            const data = await openAIResponse.json();
            if (!data.choices || !data.choices.length) {
                console.error('Unexpected OpenAI API response:', data);
                return res.status(500).json({ error: 'Unexpected response from OpenAI API' });
            }

            const botResponse = data.choices[0].message.content.trim();
            botMessage = botResponse;

            // Generate TTS audio for the bot's response
            const ttsResponse = await fetch('https://api.openai.com/v1/audio/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    input: botResponse,
                    voiceSettings: { languageCode: 'en-US', voiceType: 'neutral' } // Customize as needed
                })
            });

            if (!ttsResponse.ok) {
                const errorData = await ttsResponse.json();
                console.error('TTS API Error:', errorData);
                return res.status(ttsResponse.status).json({ error: errorData.error.message || 'Error from TTS API' });
            }

            const ttsData = await ttsResponse.json();
            const audioContent = ttsData.audioContent;

            // Send bot's text response and audio (as Base64 encoded string) back to the frontend
            res.status(200).json({ response: botMessage, audio: audioContent });
        }
    } catch (error) {
        console.error('Error in chatbot function:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
};
