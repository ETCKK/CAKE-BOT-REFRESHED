const { OpenAI } = require('openai');
const instructions = require('../../locales/instructions.json');
require('dotenv').config();

let openai = null;

if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const memory = [];

async function queryOpenAI(input, model) {

    if (!openai) {
        throw new Error("OpenAI_API_KEY is missing. Please set it in the .env file.");
    }

    const content = Array.isArray(input)
        ? input.map(prompt => `"${prompt.user.username}": ${prompt.command} ${prompt.text}`).join(',\n')
        : `"${input.user.username}": ${input.command} ${input.text}`;

    memory.push({ role: "user", content: content });

    while (memory.length > 25) {
        memory.shift();
    }

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: instructions.en },
                ...memory
            ],
            temperature: 0.8,
            max_tokens: 70,
        });

        const answer = response.choices[0].message.content;
        memory.push({ role: "assistant", content: answer });

        const splitted = answer.split(" ");

        return {
            command: splitted[0],
            content: splitted.slice(1).join(" ")
        };

    } catch (error) {
        console.error('❌ OpenAI API error:', error.message);
        return '!silent';
    }
}

module.exports = { queryOpenAI };