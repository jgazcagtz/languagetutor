const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure this environment variable is set securely
    const { message } = req.body;

    // Define the system prompt
    const systemPrompt = 'You are a multilingual language tutor specializing in English, Spanish, French, German, and Portuguese. Answer questions about grammar, vocabulary, pronunciation, and language usage in these languages. Respond in the same language as the user\'s input, and adapt explanations for each language\'s nuances. Provide helpful examples in the target language and encourage the user to practice.';

    // Function to detect the language of the user's input
    async function detectLanguage(text) {
        const response = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                prompt: `Identify the ISO 639-1 language code of the following text: "${text}"\n\nLanguage code:`,
                max_tokens: 5,
                temperature: 0
            })
        });
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].text.trim();
        } else {
            throw new Error('Could not detect language');
        }
    }

    try {
        let botMessage;
        let languageCode = 'en'; // Default to English

        if (!message) {
            // If no message is provided, send a welcome message
            botMessage = 'Welcome to the Multilingual Language Tutor! I can help you learn English, Spanish, French, German, or Portuguese. Feel free to ask me questions about grammar, vocabulary, pronunciation, or anything else related to these languages.';
        } else {
            // Detect the language of the user's message
            languageCode = await detectLanguage(message);

            // Map language codes to OpenAI-supported language codes
            const supportedLanguages = ['en', 'es', 'fr', 'de', 'pt'];
            if (!supportedLanguages.includes(languageCode)) {
                languageCode = 'en'; // Default to English if unsupported language
            }

            // Make a request to OpenAI API
            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            // Check if the response is OK
            if (!openAIResponse.ok) {
                const errorData = await openAIResponse.json();
                console.error('OpenAI API Error:', errorData);
                return res.status(openAIResponse.status).json({ error: errorData.error.message || 'Error from OpenAI API' });
            }

            // Parse the response from OpenAI
            const data = await openAIResponse.json();

            // Ensure the response structure is as expected
            if (!data.choices || !data.choices.length) {
                console.error('Unexpected OpenAI API response:', data);
                return res.status(500).json({ error: 'Unexpected response from OpenAI API' });
            }

            const botResponse = data.choices[0].message.content.trim();

            // Assign the bot's response to botMessage
            botMessage = botResponse;
        }

        // Map language codes to language tags for speech synthesis
        const languageCodeMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'pt': 'pt-PT'
        };

        // Send bot's response back to the frontend along with the language code
        res.status(200).json({ response: botMessage, languageCode: languageCodeMap[languageCode] || 'en-US' });
    } catch (error) {
        console.error('Error in chatbot function:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
};
