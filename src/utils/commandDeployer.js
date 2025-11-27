require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function deployCommands(mode = 'global', guildId = null) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        logger.logInfo('Started refreshing application (/) commands.');
        console.log('DEBUG: DISCORD_CLIENT_ID is:', process.env.DISCORD_CLIENT_ID);

        if (mode === 'global') {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands },
            );
            logger.logInfo('Successfully reloaded application (/) commands globally.');
        } else if (mode === 'guild' && guildId) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                { body: commands },
            );
            logger.logInfo(`Successfully reloaded application (/) commands for guild ${guildId}.`);
        } else {
            throw new Error("Invalid deployment mode or missing guildId for 'guild' mode.");
        }

    } catch (error) {
        logger.logError(error);
    }
}


if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args[0] || 'global';
    const guildId = args[1] || null;
    deployCommands(mode, guildId);
}


module.exports = { deployCommands };
