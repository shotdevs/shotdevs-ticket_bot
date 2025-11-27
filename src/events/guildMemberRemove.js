const { Events } = require('discord.js');
const { WelcomeSettings } = require('../models');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const welcomeSettings = await WelcomeSettings.findOne({ guildId: member.guild.id });
    if (!welcomeSettings || !welcomeSettings.goodbyeChannelId) {
      return;
    }

    const goodbyeChannel = await member.guild.channels.fetch(welcomeSettings.goodbyeChannelId).catch(() => null);
    if (!goodbyeChannel) {
      return;
    }

    await goodbyeChannel.send({
      content: welcomeSettings.goodbyeMessage.replace('{{user}}', member.user.tag),
    });
  },
};
