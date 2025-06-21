const { Groq } = require('groq-sdk');
const instructions = require('../../locales/instructions.json');
require('dotenv').config();

const groq = new Groq({apiKey: process.env.GROQ_API_KEY});

memory = [];

async function queryGroq(prompt, user) {
    const content = '"' + user.username + '" ' + prompt;

    memory.push({
        "role": "user",
        "content": content
    });

    if (memory.length > 25) memory.shift();

    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "system",
          "content": instructions.en
        },
        ...memory
      ],
      "model": "llama3-70b-8192",
      "temperature": 1,
      "max_completion_tokens": 1024,
      "top_p": 1,
      "stream": false,
      "stop": null
    });

    const answer = chatCompletion.choices[0].message.content || "!silent";
    memory.push({
        "role": "assistant",
        "content": answer
    });

    if (memory.length > 25) memory.shift();

    return answer;
}

module.exports = { queryGroq };