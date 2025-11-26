const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { WelcomeSettings } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('Configure the welcome system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the welcome channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send welcome messages in.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('message')
        .setDescription('Set the welcome message.')
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('The welcome message. Use {{user}} for user mention.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('background')
        .setDescription('Set the background image for the welcome card.')
        .addStringOption(option =>
          option
            .setName('url')
            .setDescription('The URL of the background image.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('role')
        .setDescription('Set the role to give to new members.')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to give to new members.')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let settings = await WelcomeSettings.findOne({ guildId });
    if (!settings) {
      settings = new WelcomeSettings({ guildId });
    }

    if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('channel');
      settings.welcomeChannelId = channel.id;
      await settings.save();
      await interaction.reply({
        content: `Welcome channel set to ${channel}.`,
        ephemeral: true,
      });
    } else if (subcommand === 'message') {
      const message = interaction.options.getString('message');
      settings.welcomeMessage = message;
      await settings.save();
      await interaction.reply({
        content: 'Welcome message updated.',
        ephemeral: true,
      });
    } else if (subcommand === 'background') {
        const url = interaction.options.getString('url');
        settings.welcomeBackgroundImage = url;
        await settings.save();
        await interaction.reply({
            content: 'Welcome card background updated.',
            ephemeral: true,
        });
    } else if (subcommand === 'role') {
        const role = interaction.options.getRole('role');
        settings.welcomeRole = role.id;
        await settings.save();
        await interaction.reply({
            content: `Welcome role set to ${role}.`,
            ephemeral: true,
        });
    }
  },
};
