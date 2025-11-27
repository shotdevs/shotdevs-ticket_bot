const { SlashCommandBuilder } = require('discord.js');
const { VcTime } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vctime')
    .setDescription('Check your total time spent in voice channels.'),
  async execute(interaction) {
    const userVcTime = await VcTime.findOne({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
    });

    if (!userVcTime) {
      return interaction.reply({
        content: 'You have not spent any time in voice channels yet.',
        ephemeral: true,
      });
    }

    const timeInSeconds = Math.floor(userVcTime.timeInVC / 1000);
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    await interaction.reply({
      content: `You have spent ${hours} hours, ${minutes} minutes, and ${seconds} seconds in voice channels.`,
      ephemeral: true,
    });
  },
};
