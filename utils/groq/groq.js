const { Groq } = require('groq-sdk');
const instructions = require('../../locales/instructions.json');
require('dotenv').config();

let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

memory = [];

async function queryGroq(input, model) {

    if (!groq) {
        throw new Error("GROQ_API_KEY is missing. Please set it in the .env file.");
    }

    const content = Array.isArray(input)
        ? input.map(prompt => `"${prompt.user.username}": ${prompt.command} ${prompt.text}`).join(',\n')
        : `"${input.user.username}": ${input.command} ${input.text}`;

    memory.push({ "role": "user", "content": content });

    while (memory.length > 25) {
        memory.shift();
    }

    try {

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": instructions.en
                },
                ...memory
            ],
            "model": model,
            "temperature": 1,
            "max_completion_tokens": 70,
            "top_p": 1,
            "stream": false,
            "stop": null
        });

        const answer = chatCompletion.choices[0].message.content || "!silent";
        memory.push({ "role": "assistant", "content": answer });

        const splitted = answer.split(" ");

        return {
            command: splitted[0],
            content: splitted.slice(1).join(" ")
        };

    } catch (error) {
        console.error('❌ Groq API error:', error.message);
        return '!silent';
    }
}

module.exports = { queryGroq };