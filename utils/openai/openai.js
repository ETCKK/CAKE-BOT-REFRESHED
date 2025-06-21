const { OpenAI } = require('openai');
const instructions = require('../../locales/instructions.json');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const memory = [];

async function queryOpenAI(content, model) {

    memory.push({ role: "user", content: content });

    if (memory.length > 25) memory.shift();

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: instructions.en },
                ...memory
            ],
            temperature: 0.8,
            max_tokens: 150,
        });

        const answer = response.choices[0].message.content;

        memory.push({ role: "assistant", content: answer });
        if (memory.length > 25) memory.shift();

        return answer;

    } catch (error) {
        console.error('❌ OpenAI API error:', error.message);
        return '!silent';
    }
}

module.exports = { queryOpenAI };