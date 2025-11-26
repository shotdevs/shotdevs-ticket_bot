const { Events, EmbedBuilder } = require('discord.js');
const { GuildConfig } = require('../models');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
    if (!guildConfig || !guildConfig.messageLogChannelId) {
      return;
    }

    const logChannel = await message.guild.channels.fetch(guildConfig.messageLogChannelId).catch(() => null);
    if (!logChannel) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Message Deleted')
      .addFields(
        { name: 'Author', value: message.author.tag, inline: true },
        { name: 'Channel', value: message.channel.toString(), inline: true },
        { name: 'Content', value: message.content || 'No content' }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  },
};
