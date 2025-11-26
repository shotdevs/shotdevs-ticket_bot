const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { GuildConfig } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-messagelog')
    .setDescription('Configure the message logging system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send message logs in.')
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    let guildConfig = await GuildConfig.findOne({ guildId });
    if (!guildConfig) {
      guildConfig = new GuildConfig({ guildId });
    }

    guildConfig.messageLogChannelId = channel.id;
    await guildConfig.save();

    await interaction.reply({
      content: `Message log channel set to ${channel}.`,
      ephemeral: true,
    });
  },
};
