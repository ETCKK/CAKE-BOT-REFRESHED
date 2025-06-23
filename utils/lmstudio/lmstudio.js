const axios = require('axios');
const instructions = require('../../locales/instructions.json');
require('dotenv').config();

const memory = [];

async function queryLMStudio(input, model) {

    const content = Array.isArray(input)
        ? input.map(prompt => `"${prompt.user.username}": ${prompt.command} ${prompt.text}`).join(',\n')
        : `"${input.user.username}": ${input.command} ${input.text}`;

    memory.push({ role: "user", content: content });

    while (memory.length > 25) {
        memory.shift();
    }

    try {

        const response = await axios.post(
            'http://127.0.0.1:1234/v1/chat/completions',
            {
                model: model,
                messages:
                    [
                        {
                            role: "system",
                            content: instructions.en
                        },
                        ...memory,
                        { role: "user", content: content }
                    ],
                max_tokens: 512,
            }
        );

        const answer = response.data.choices[0].message.content;
        memory.push({ role: "assistant", content: answer });

        const splitted = answer.split(" ");

        return {
            command: splitted[0],
            content: splitted.slice(1).join(" ")

        }
    } catch (error) {
        console.error('❌ LM Studio Server error:', error.message);
        return '!silent';
    }
}



module.exports = { queryLMStudio };