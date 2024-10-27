module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure this environment variable is set securely
    const { message, max_tokens } = req.body;

    // Updated system prompt
    const systemPrompt = `You are Language Tutor, a friendly, knowledgeable language tutor specializing in English, Spanish, French, German, and Portuguese. You are here to help students learn and practice these languages by answering questions, providing explanations, testing their skills, and offering level assessments upon request.

    Engage in fluid, natural conversations, responding in the language of the user's input while keeping explanations clear and approachable. Use examples, ask follow-up questions, and encourage students to practice aloud or in writing. Adjust the complexity of explanations based on the student’s responses and apparent level.

    If a student requests an assessment, evaluate their language level by asking questions of increasing difficulty and provide an estimated level (e.g., beginner, intermediate, advanced) based on their responses. Offer tips for improvement tailored to their level and suggest resources or exercises for additional practice.

    Above all, make the learning process enjoyable, accessible, and responsive to each student’s unique needs.`;

    // Define default max_tokens if not provided
    const defaultMaxTokens = 500;

    try {
        let botMessage;

        if (!message) {
            // Initial welcome message
            botMessage = 'Welcome to Language Tutor! I can help you learn English, Spanish, French, German, or Portuguese. Feel free to ask me questions about grammar, vocabulary, pronunciation, or anything else related to these languages. For example, you can ask "How do I conjugate the verb \'to be\' in Spanish?" or "What are some common phrases in German for traveling?" Which language would you like to start with?';
        } else {
            // Send the user's message to the OpenAI API
            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4', // GPT-4 model
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

            if (!openAIResponse.ok) {
                const errorData = await openAIResponse.json();
                console.error('OpenAI API Error:', errorData);
                return res.status(openAIResponse.status).json({ error: errorData.error.message || 'Error from OpenAI API' });
            }

            // Parse the OpenAI response
            const data = await openAIResponse.json();

            if (!data.choices || !data.choices.length) {
                console.error('Unexpected OpenAI API response:', data);
                return res.status(500).json({ error: 'Unexpected response from OpenAI API' });
            }

            botMessage = data.choices[0].message.content.trim();
        }

        res.status(200).json({ response: botMessage });
    } catch (error) {
        console.error('Error in chatbot function:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
};
