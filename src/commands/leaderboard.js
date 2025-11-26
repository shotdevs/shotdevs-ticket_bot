const { SlashCommandBuilder } = require('discord.js');
const { Leveling } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('See the top 10 users on the server.'),
  async execute(interaction) {
    const leaderboard = await Leveling.find({ guildId: interaction.guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(10);

    if (leaderboard.length === 0) {
      return interaction.reply({
        content: 'No one is on the leaderboard yet.',
        ephemeral: true,
      });
    }

    const leaderboardString = leaderboard
      .map((user, index) => {
        return `${index + 1}. <@${user.userId}> - Level ${user.level} (${user.xp} XP)`;
      })
      .join('\n');

    await interaction.reply({
      content: `**Leaderboard**\n${leaderboardString}`,
    });
  },
};
