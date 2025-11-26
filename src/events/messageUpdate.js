const { Events, EmbedBuilder } = require('discord.js');
const { GuildConfig } = require('../models');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;

    const guildConfig = await GuildConfig.findOne({ guildId: oldMessage.guild.id });
    if (!guildConfig || !guildConfig.messageLogChannelId) {
      return;
    }

    const logChannel = await oldMessage.guild.channels.fetch(guildConfig.messageLogChannelId).catch(() => null);
    if (!logChannel) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('Message Edited')
      .addFields(
        { name: 'Author', value: oldMessage.author.tag, inline: true },
        { name: 'Channel', value: oldMessage.channel.toString(), inline: true },
        { name: 'Old Content', value: oldMessage.content || 'No content' },
        { name: 'New Content', value: newMessage.content || 'No content' }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  },
};
