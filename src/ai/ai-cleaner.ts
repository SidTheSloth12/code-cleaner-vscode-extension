import { CleanOptions } from '../config';

export async function aiCleanCode(text: string, languageId: string, options: CleanOptions): Promise<string> {
    if (!options.apiKey) {
        throw new Error('Please configure an API Key for the AI Provider in the CodeCleaner settings.');
    }

    const prompt = `You are an expert ${languageId} developer. Please clean, refactor, and improve the following code.
    Fix any obvious anti-patterns, improve variable names if they are ambiguous, and add helpful comments where necessary.
    Return ONLY the code, without markdown formatting or backticks.
    
    Code:
    ${text}`;

    if (options.aiProvider === 'Gemini') {
        try {
            const { GoogleGenAI } = require('@google/genai');
            const ai = new GoogleGenAI({ apiKey: options.apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text || text;
        } catch (e: any) {
            throw new Error(`Gemini API Error: ${e.message}`);
        }
    } else if (options.aiProvider === 'OpenAI') {
        try {
            const { OpenAI } = require('openai');
            const openai = new OpenAI({ apiKey: options.apiKey });
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
            });
            return response.choices[0]?.message?.content || text;
        } catch (e: any) {
            throw new Error(`OpenAI API Error: ${e.message}`);
        }
    }
    
    return text;
}
