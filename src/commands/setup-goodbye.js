const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { WelcomeSettings } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-goodbye')
    .setDescription('Configure the goodbye system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the goodbye channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send goodbye messages in.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('message')
        .setDescription('Set the goodbye message.')
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('The goodbye message. Use {{user}} for user tag.')
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
      settings.goodbyeChannelId = channel.id;
      await settings.save();
      await interaction.reply({
        content: `Goodbye channel set to ${channel}.`,
        ephemeral: true,
      });
    } else if (subcommand === 'message') {
      const message = interaction.options.getString('message');
      settings.goodbyeMessage = message;
      await settings.save();
      await interaction.reply({
        content: 'Goodbye message updated.',
        ephemeral: true,
      });
    }
  },
};
