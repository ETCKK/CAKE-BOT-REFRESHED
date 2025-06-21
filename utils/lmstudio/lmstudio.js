const axios = require('axios');
const instructions = require('../../locales/instructions.json');
require('dotenv').config();

const memory = [];

async function queryLMStudio(prompt, user) {

    const content = '"' + user.username + '" ' + prompt;

    memory.push({ role: "user", content: content });

    if (memory.length > 25) memory.shift();

    const response = await axios.post(
        'http://127.0.0.1:1234/v1/chat/completions',
        {
            model: 'turkish-llama-8b-instruct-v0.1',
            messages: 
            [
                { 
                    role: "system", 
                    content: instructions.tr
                },
                ...memory,
                { role: "user", content: content }
            ],
            max_tokens: 512,
        }
    );
    const answer = response.data.choices[0].message.content;

    memory.push({ 
        role: "assistant", 
        content: answer 
    });

    if (memory.length > 25) memory.shift();

    return answer;
}



module.exports = { queryLMStudio };