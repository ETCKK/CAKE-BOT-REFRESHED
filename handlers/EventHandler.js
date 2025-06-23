const fs = require('fs');
const path = require('path');

class EventHandler {
    constructor(client) {
        this.client = client;
    }

    init(eventsPath) {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(...args, this.client));
            } else {
                this.client.on(event.name, (...args) => event.execute(...args, this.client));
            }
        }
    }
}

module.exports = EventHandler;