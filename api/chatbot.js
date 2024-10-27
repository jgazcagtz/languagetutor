// ./api/chatbot.js

// No es necesario requerir 'node-fetch' ya que fetch está disponible globalmente en Node.js 18+ en Vercel

// Definir constantes fuera del manejador para prevenir redefiniciones en cada solicitud
const SYSTEM_PROMPT = `
You are a multilingual language tutor specializing in English, Spanish, French, German, and Portuguese. 
Answer questions about grammar, vocabulary, pronunciation, and language usage in these languages. 
Respond in the same language as the user's input, and adapt explanations for each language's nuances. 
Provide helpful examples and encourage the user to practice. Your name is Language Tutor.
`.trim();

const DEFAULT_MAX_TOKENS = 500;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_ALLOWED_TOKENS = 4096; // Ajusta según los tokens máximos del modelo
const FETCH_TIMEOUT = 10000; // 10,000 ms = 10 segundos

module.exports = async (req, res) => {
    // Asegurar que el método de solicitud sea POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    const { messages, max_tokens } = req.body;

    // Validar la variable de entorno
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
    }

    // Validación de entrada
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid input: "messages" must be an array.' });
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
        // Preparar la carga útil para la API de OpenAI
        const payload = {
            model: 'gpt-4',
            messages: messages,
            max_tokens: max_tokens || DEFAULT_MAX_TOKENS,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        };

        // Implementar un timeout para la solicitud de fetch usando AbortController
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

        // Verificar si la respuesta es OK
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

        // Parsear la respuesta de OpenAI
        let data;
        try {
            data = await openAIResponse.json();
        } catch (parseError) {
            console.error('Failed to parse OpenAI API response:', parseError);
            return res.status(500).json({ error: 'Invalid response from OpenAI API.' });
        }

        // Asegurar que la estructura de la respuesta sea la esperada
        if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
            console.error('Unexpected OpenAI API response structure:', data);
            return res.status(500).json({ error: 'Unexpected response from OpenAI API.' });
        }

        const botResponse = data.choices[0].message?.content?.trim();

        if (!botResponse) {
            console.error('OpenAI API returned an empty response:', data);
            return res.status(500).json({ error: 'Received empty response from OpenAI API.' });
        }

        // Enviar la respuesta del bot de vuelta al frontend
        res.status(200).json({ response: botResponse });
    } catch (error) {
        console.error('Unexpected error in chatbot function:', error);
        res.status(500).json({ error: 'Error processing request.' });
    }
};
