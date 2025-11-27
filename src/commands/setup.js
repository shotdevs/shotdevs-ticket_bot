const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildConfig } = require('../models');
const { createSuccessContainer } = require('../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { MessageFlags , MessageFlags } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure bot settings for the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('init')
                .setDescription('Initializes the bot configuration for this guild.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('log-channel')
                .setDescription('Set the default log channel.')
                .addChannelOption(option => option.setName('channel').setDescription('The channel to use for logs').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rate-limit')
                .setDescription('Configure the ticket creation rate limit.')
                .addBooleanOption(option => option.setName('enabled').setDescription('Enable or disable the rate limit.').setRequired(true))
                .addIntegerOption(option => option.setName('cooldown').setDescription('The cooldown in seconds.'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('dm-notifications')
                .setDescription('Toggle DM notifications for ticket events.')
                .addBooleanOption(option => option.setName('on-create').setDescription('Send DM on ticket creation.'))
                .addBooleanOption(option => option.setName('on-close').setDescription('Send DM on ticket close.'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('auto-close')
                .setDescription('Configure auto-closing of inactive tickets.')
                .addBooleanOption(option => option.setName('enabled').setDescription('Enable or disable auto-close.').setRequired(true))
                .addIntegerOption(option => option.setName('inactivity-period').setDescription('The inactivity period in hours.'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcripts')
                .setDescription('Configure transcript settings.')
                .addBooleanOption(option => option.setName('enabled').setDescription('Enable or disable transcripts.').setRequired(true))
                .addStringOption(option => option.setName('format').setDescription('The transcript format.').addChoices({ name: 'HTML', value: 'html' }, { name: 'Text', value: 'txt' }))
        ),

    async execute(interaction) {
        let interactionReplyAvailable = true;
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Failed to defer reply (setup):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }
        try {
            const subcommand = interaction.options.getSubcommand();
            const guildConfig = await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { guildId: interaction.guild.id },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (subcommand === 'init') {
                await interaction.editReply(createSuccessContainer('Guild configuration initialized.'));
            } else if (subcommand === 'log-channel') {
                const channel = interaction.options.getChannel('channel');
                guildConfig.defaultLogChannel = channel.id;
                await guildConfig.save();
                await interaction.editReply(createSuccessContainer(`Log channel set to ${channel.name}.`));
            } else if (subcommand === 'rate-limit') {
                const enabled = interaction.options.getBoolean('enabled');
                const cooldown = interaction.options.getInteger('cooldown');
                guildConfig.rateLimit.enabled = enabled;
                if (cooldown) guildConfig.rateLimit.cooldown = cooldown * 1000;
                await guildConfig.save();
                await interaction.editReply(createSuccessContainer('Rate limit settings updated.'));
            } else if (subcommand === 'dm-notifications') {
                const onCreate = interaction.options.getBoolean('on-create');
                const onClose = interaction.options.getBoolean('on-close');
                if (onCreate !== null) guildConfig.dmNotifications.onCreate = onCreate;
                if (onClose !== null) guildConfig.dmNotifications.onClose = onClose;
                await guildConfig.save();
                await interaction.editReply(createSuccessContainer('DM notification settings updated.'));
            } else if (subcommand === 'auto-close') {
                const enabled = interaction.options.getBoolean('enabled');
                const inactivityPeriod = interaction.options.getInteger('inactivity-period');
                guildConfig.autoClose.enabled = enabled;
                if (inactivityPeriod) guildConfig.autoClose.inactivityPeriod = inactivityPeriod * 3600000;
                await guildConfig.save();
                await interaction.editReply(createSuccessContainer('Auto-close settings updated.'));
            } else if (subcommand === 'transcripts') {
                const enabled = interaction.options.getBoolean('enabled');
                const format = interaction.options.getString('format');
                guildConfig.transcripts.enabled = enabled;
                if (format) guildConfig.transcripts.format = format;
                await guildConfig.save();
                await interaction.editReply(createSuccessContainer('Transcript settings updated.'));
            }
        } catch (error) {
            logger.logError('Setup command error:', error);
            try {
                if (interactionReplyAvailable && !interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred while processing your command.', flags: MessageFlags.Ephemeral });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: 'An error occurred while processing your command.' });
                } else {
                    await interaction.channel?.send({ content: 'An error occurred while processing your command.' });
                }
            } catch (replyErr) {
                console.error('Failed to send error notification (setup):', replyErr);
            }
        }
    },
};

