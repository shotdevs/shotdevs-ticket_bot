require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const { connectDatabase } = require('./src/utils/database');
const logger = require('./src/utils/logger');
const { setupGlobalErrorHandlers } = require('./src/utils/errorHandler');
const LicenseManager = require('./src/utils/LicenseManager');

async function startBot() {
    console.log('Verifying license...');

    const licenseManager = new LicenseManager(process.env.LICENSE_API_BASE_URL, process.env.CLIENT_ID);
    const verificationResult = await licenseManager.verifyLicense(process.env.LICENSE_KEY);

    if (!verificationResult.success) {
        console.error(`[LICENSE ERROR] ${verificationResult.message}`);
        console.error('Bot will not start due to a failed license verification.');
        process.exit(1);
    }

    console.log(`[LICENSE INFO] ${verificationResult.message}`);

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildVoiceStates,
        ],
    });

    client.commands = new Collection();

    const eventsPath = path.join(__dirname, 'src/events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    const commandsPath = path.join(__dirname, 'src/commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    }

    connectDatabase();
    setupGlobalErrorHandlers();

    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('Failed to log in to Discord. Please check your DISCORD_TOKEN.', error);
        process.exit(1);
    }

    process.on('SIGINT', () => {
        logger.logInfo('Shutting down...');
        client.destroy();
        mongoose.connection.close();
        process.exit(0);
    });
}

startBot();
