// ./api/chatbot.js

// No need to require 'node-fetch' as fetch is globally available in Node.js 18+ on Vercel

// Define constants outside the handler to prevent redefinition on every request
const SYSTEM_PROMPT = `
You are a multilingual language tutor specializing in English, Spanish, French, German, and Portuguese. 
Answer questions about grammar, vocabulary, pronunciation, and language usage in these languages. 
Respond in the same language as the user's input, and adapt explanations for each language's nuances. 
Provide helpful examples and encourage the user to practice. Your name is Language Tutor.
`.trim();

const DEFAULT_MAX_TOKENS = 500;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_ALLOWED_TOKENS = 4096; // Adjust based on the model's maximum tokens
const FETCH_TIMEOUT = 10000; // 10,000 ms = 10 seconds

module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const { message, max_tokens } = req.body;

    // Validate environment variable
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
    }

    // Input validation
    if (message && typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid input: "message" must be a string.' });
    }

    if (
        max_tokens !== undefined &&
        (typeof max_tokens !== 'number' || max_tokens <= 0 || max_tokens > MAX_ALLOWED_TOKENS)
    ) {
        return res.status(400).json({
            error: `Invalid input: "max_tokens" must be a positive number not exceeding ${MAX_ALLOWED_TOKENS}.`,
        });
    }

    try {
        let botMessage;

        if (!message) {
            // If no message is provided, send a welcome message
            botMessage = `
Welcome to Language Tutor! I can help you learn English, Spanish, French, German, or Portuguese. 
Feel free to ask me questions about grammar, vocabulary, pronunciation, or anything else related to these languages. 
For example, you can ask "How do I conjugate the verb 'to be' in Spanish?" or 
"What are some common phrases in German for traveling?" 
Which language would you like to start with?
            `.trim();
        } else {
            // Prepare the payload for OpenAI API
            const payload = {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT,
                    },
                    { role: 'user', content: message },
                ],
                max_tokens: max_tokens || DEFAULT_MAX_TOKENS,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            };

            // Implement a timeout for the fetch request using AbortController
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
            }, FETCH_TIMEOUT);

            let openAIResponse;
            try {
                openAIResponse = await fetch(OPENAI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    console.error('OpenAI API request timed out.');
                    return res.status(504).json({
                        error: 'OpenAI API request timed out. Please try again later.',
                    });
                }
                console.error('Error making request to OpenAI API:', fetchError);
                return res.status(502).json({ error: 'Failed to communicate with OpenAI API.' });
            } finally {
                clearTimeout(timeout);
            }

            // Check if the response is OK
            if (!openAIResponse.ok) {
                let errorData;
                try {
                    errorData = await openAIResponse.json();
                } catch (parseError) {
                    console.error('Failed to parse OpenAI API error response:', parseError);
                    return res.status(openAIResponse.status).json({ error: 'Error from OpenAI API.' });
                }

                console.error('OpenAI API Error:', errorData);
                const errorMessage = errorData.error?.message || 'Error from OpenAI API.';
                return res.status(openAIResponse.status).json({ error: errorMessage });
            }

            // Parse the response from OpenAI
            let data;
            try {
                data = await openAIResponse.json();
            } catch (parseError) {
                console.error('Failed to parse OpenAI API response:', parseError);
                return res.status(500).json({ error: 'Invalid response from OpenAI API.' });
            }

            // Ensure the response structure is as expected
            if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                console.error('Unexpected OpenAI API response structure:', data);
                return res.status(500).json({ error: 'Unexpected response from OpenAI API.' });
            }

            const botResponse = data.choices[0].message?.content?.trim();

            if (!botResponse) {
                console.error('OpenAI API returned an empty response:', data);
                return res.status(500).json({ error: 'Received empty response from OpenAI API.' });
            }

            // Assign the bot's response to botMessage
            botMessage = botResponse;
        }

        // Send bot's response back to the frontend
        res.status(200).json({ response: botMessage });
    } catch (error) {
        console.error('Unexpected error in chatbot function:', error);
        res.status(500).json({ error: 'Error processing request.' });
    }
};
