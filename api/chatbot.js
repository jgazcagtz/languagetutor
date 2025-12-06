module.exports = async (req, res) => {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const { message, conversationHistory, language, mode, max_tokens } = req.body;

    // Mode-specific system prompt additions
    const modeInstructions = {
        conversation: 'Focus on natural, engaging conversation practice. Encourage the student to express themselves and provide gentle corrections when needed.',
        grammar: 'Provide detailed grammar explanations with clear examples. Break down complex rules into understandable parts and offer practice sentences.',
        vocabulary: 'Teach new vocabulary in context. Provide definitions, usage examples, synonyms, and create sample sentences. Help build a strong vocabulary foundation.',
        practice: 'Create interactive exercises and quizzes. Test the student\'s knowledge with fill-in-the-blanks, translations, or sentence construction. Provide immediate feedback.',
        assessment: 'Evaluate the student\'s proficiency through progressive questioning. Start with basic questions and increase difficulty. Provide a level assessment (A1-C2) with constructive feedback.',
        teaching: 'Act as an expert teaching assistant for language educators. Provide lesson plan suggestions, exercise generation, teaching tips, cultural context notes, common student mistakes to watch for, pronunciation guides, differentiated instruction ideas, classroom activity suggestions, and professional teaching strategies. Help teachers create engaging, effective lessons.'
    };

    // Enhanced system prompt
    const systemPrompt = `You are Language Tutor, an expert AI language instructor specializing in English, Spanish, French, German, and Portuguese. You are passionate about teaching and deeply knowledgeable about language acquisition.

Your teaching approach:
- Respond in the language being learned (${language || 'the student\'s chosen language'}) while keeping explanations clear and appropriate to the student's level
- Be encouraging, patient, and supportive
- Adapt complexity based on the student's responses
- Use examples from real-world contexts
- Correct errors gently and constructively
- Ask follow-up questions to deepen understanding
- Celebrate progress and milestones

Current mode: ${mode || 'conversation'}
${modeInstructions[mode] || modeInstructions.conversation}

Teaching guidelines:
1. For beginners: Use simple vocabulary, short sentences, and provide translations when helpful
2. For intermediate: Challenge with complex structures while remaining accessible
3. For advanced: Discuss nuanced topics, idioms, and cultural context
4. Always provide context for grammar rules
5. Use formatting for clarity: **bold** for emphasis, *italic* for examples, \`code\` for linguistic terms

Remember: Your goal is to make language learning enjoyable, effective, and personalized to each student's needs.`;

    const defaultMaxTokens = 500;

    try {
        let botMessage;

        if (!message) {
            // Initial welcome message
            botMessage = `Welcome to Language Tutor! 🌍

I'm your AI language learning companion, ready to help you master English, Spanish, French, German, or Portuguese.

**How I can help you:**
- 💬 Practice natural conversations
- 📖 Explain grammar rules and usage
- 📝 Build your vocabulary
- 🎯 Provide targeted exercises
- 📊 Assess your proficiency level

**Getting started:**
1. Select your target language from the sidebar
2. Choose a learning mode or start with free conversation
3. Ask me anything or use the conversation starters!

Which language would you like to learn today?`;
        } else {
            // Build messages array with conversation history
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ];

            // Optimize conversation history for token usage AND speed
            if (conversationHistory && Array.isArray(conversationHistory)) {
                // Reduce to last 10 messages for context
                const optimizedHistory = conversationHistory.length <= 10 
                    ? conversationHistory 
                    : conversationHistory.slice(-10);
                
                messages.push(...optimizedHistory);
            } else {
                messages.push({ role: 'user', content: message });
            }

            // Make request to DeepSeek
            const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                max_tokens: Math.min(max_tokens || defaultMaxTokens, 500),
                temperature: 0.7,
                top_p: 0.95,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: false
            })
            });

            if (!deepSeekResponse.ok) {
                const errorData = await deepSeekResponse.json().catch(() => ({}));
                console.error('DeepSeek API Error:', errorData);
                
                if (deepSeekResponse.status === 429) {
                    return res.status(429).json({ 
                        error: 'Our AI is currently busy. Please try again in a moment.' 
                    });
                } else if (deepSeekResponse.status === 401) {
                    return res.status(500).json({ 
                        error: 'Authentication error. Please contact support.' 
                    });
                } else {
                    return res.status(deepSeekResponse.status).json({ 
                        error: errorData.error?.message || 'Error from AI service. Please try again.' 
                    });
                }
            }

            const data = await deepSeekResponse.json();

            if (!data.choices || !data.choices.length) {
                console.error('Unexpected DeepSeek API response:', data);
                return res.status(500).json({ 
                    error: 'Unexpected response from AI. Please try again.' 
                });
            }

            botMessage = data.choices[0].message.content.trim();
        }

        res.status(200).json({ response: botMessage });
    } catch (error) {
        console.error('Error in chatbot function:', error);
        
        // Provide user-friendly error messages
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Unable to connect to AI service. Please check your internet connection.' 
            });
        }
        
        res.status(500).json({ 
            error: 'An error occurred while processing your request. Please try again.' 
        });
    }
};
