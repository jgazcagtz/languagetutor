module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure this environment variable is set securely
    const { message, max_tokens } = req.body;

    // Define the system prompt
    const systemPrompt = 'You are a multilingual language tutor specializing in English, Spanish, French, German, and Portuguese. Answer questions about grammar, vocabulary, pronunciation, and language usage in these languages. Respond in the same language as the user\'s input, and adapt explanations for each language\'s nuances. Provide helpful examples and encourage the user to practice.';

    // Define default max_tokens if not provided
    const defaultMaxTokens = 500;

    try {
        let botMessage;

        if (!message) {
            // If no message is provided, send a welcome message
            botMessage = 'Welcome to the Multilingual Language Tutor! I can help you learn English, Spanish, French, German, or Portuguese. Feel free to ask me questions about grammar, vocabulary, pronunciation, or anything else related to these languages. For example, you can ask "How do I conjugate the verb \'to be\' in Spanish?" or "What are some common phrases in German for traveling?" Which language would you like to start with?';
        } else {
            // Make a request to OpenAI API using the native fetch API
            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4', // Upgraded to GPT-4 model
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        { role: 'user', content: message }
                    ],
                    max_tokens: max_tokens || defaultMaxTokens,
                    temperature: 0.7, // Adjust temperature for response creativity
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

        // Send bot's response back to the frontend
        res.status(200).json({ response: botMessage });
    } catch (error) {
        console.error('Error in chatbot function:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
};
