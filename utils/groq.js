const { Groq } = require('groq-sdk');
const instructions = require('../locales/instructions.json');

const groq = new Groq({apiKey: process.env.GROQ_API_KEY});

messageHistory = [];

async function queryGroq(prompt, user) {
    const content = '"' + user.username + '" ' + prompt;

    messageHistory.push({
        "role": "user",
        "content": content
    });

    if (messageHistory.length > 25) {
        messageHistory.shift();
    }

    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "system",
          "content": instructions.en
        },
        ...messageHistory
      ],
      "model": "llama-3.1-8b-instant",
      "temperature": 1,
      "max_completion_tokens": 1024,
      "top_p": 1,
      "stream": false,
      "stop": null
    });

    return chatCompletion.choices[0].message.content || "!silent";
}

module.exports = { queryGroq };