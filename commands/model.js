const { SlashCommandBuilder } = require('discord.js');
const models = require('../utils/openai/models.json');

const command = require("../locales/commands.json").model;
module.exports = {
    data: new SlashCommandBuilder()
        .setName(command.name['en-US'])
        .setDescription(command.description['en-US'])
        .setNameLocalizations(command.name)
        .setDescriptionLocalizations(command.description)
        .addStringOption(option =>
            option
                .setName(command.options.model.name['en-US'])
                .setDescription(command.options.model.description['en-US'])
                .setNameLocalizations(command.options.model.name)
                .setDescriptionLocalizations(command.options.model.description)
                .addChoices(...models)
                .setRequired(false)
        ),

    async execute(interaction, client, locales) {
        const modelValue = interaction.options.getString(command.options.model.name['en-US']);

        if (!modelValue) {
            return await interaction.reply(locales.modelGet + client.model.name);
        }

        const model = models.find(m => m.value === modelValue);
        client.model = model;

        await interaction.reply(locales.modelSet + model.name);

    },
};