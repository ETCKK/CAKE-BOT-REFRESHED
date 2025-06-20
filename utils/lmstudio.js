const axios = require('axios');
const instructions = require('../locales/instructions.json');

const messageHistory = [];

async function queryLMStudio(prompt, user) {

    const content = '"' + user.username + '" ' + prompt;

    messageHistory.push({ role: "user", content: content });

    if (messageHistory.length > 25) {
        messageHistory.shift();
    }

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
                ...messageHistory,
                { role: "user", content: content }
            ],
            max_tokens: 512,
        }
    );
    return response.data.choices[0].message.content;
}

module.exports = { queryLMStudio };