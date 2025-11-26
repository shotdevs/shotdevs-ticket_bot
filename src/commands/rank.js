const { SlashCommandBuilder } = require('discord.js');
const { Leveling } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your current level and XP.'),
  async execute(interaction) {
    const userLevel = await Leveling.findOne({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
    });

    if (!userLevel) {
      return interaction.reply({
        content: 'You have not earned any XP yet.',
        ephemeral: true,
      });
    }

    const xpToNextLevel = 5 * (userLevel.level ** 2) + 50 * userLevel.level + 100;

    await interaction.reply({
      content: `You are at level ${userLevel.level} with ${userLevel.xp}/${xpToNextLevel} XP.`,
      ephemeral: true,
    });
  },
};
