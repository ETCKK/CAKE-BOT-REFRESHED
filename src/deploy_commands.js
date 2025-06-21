// Standalone script for deploying commands.
//
// npm run commands-global
// npm run commands-guild
// npm run commands-guild-clear

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function readCommands() {
    const commands = [];

    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }

    return commands;
}

async function deployCommands(type, commands){
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        let data;
        if (type === 'global') {
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
        } else if (type === 'guild') {
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
        } else {
            console.error("Invalid type specified. Use 'guild' or 'global'.");
            process.exit(1);
        }
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function main() {
    if (process.argv.length < 3) {
        console.error("Please specify 'global', 'guild' or 'guild-clear' as an argument.");
        process.exit(1);
    }

    if (process.argv[2] === 'guild-clear'){
        await deployCommands('guild', []);
        console.log("Successfully cleared guild commands.");
    }else{
        const commands = await readCommands();
        const deployType = process.argv[2];

        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await deployCommands(deployType, commands);
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    }
}

main();
