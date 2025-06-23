const CommandHandler = require('./CommandHandler');
const EventHandler = require('./EventHandler');
const { Collection } = require('discord.js');

class ClientHandler {
    constructor(client, options = {
        commandsPath,
        eventsPath,
        localesPath,
        modelsPath
    }) {
        this.client = client;
        this.commandsPath = options.commandsPath;
        this.eventsPath = options.eventsPath;
        this.localesPath = options.localesPath;
        this.modelsPath = options.modelsPath;
    }

    init() {

        const fs = require('fs');

        // Load locales
        this.client.locales = {};
        const localeFiles = fs.readdirSync(this.localesPath).filter(file => file.endsWith('.json'));
        for (const file of localeFiles) {
            const localeName = file.split('.')[0];
            this.client.locales[localeName] = require(`${this.localesPath}/${file}`);
        }

        // Initialize command handler
        this.commandHandler = new CommandHandler(this.client);
        this.commandHandler.init(this.commandsPath);

        // Initialize event handler
        this.eventHandler = new EventHandler(this.client);
        this.eventHandler.init(this.eventsPath);

        this.client.model = require(`${this.modelsPath}/models.json`)[0];
        this.client.voiceConnections = new Collection();
        this.client.soundboardSounds = new Collection()
        this.client.soundboardSounds.set("1250077002179022930", "what_the_hell")
        this.client.soundboardSounds.set("1104859392928645120", "boom")

    }
}

module.exports = ClientHandler;