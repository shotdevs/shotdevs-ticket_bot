const { Events } = require('discord.js');
const { WelcomeSettings } = require('../models');
const { NewWelcomeCard } = require('pixel-cards');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const welcomeSettings = await WelcomeSettings.findOne({ guildId: member.guild.id });
    if (!welcomeSettings || !welcomeSettings.welcomeChannelId) {
      return;
    }

    const welcomeChannel = await member.guild.channels.fetch(welcomeSettings.welcomeChannelId).catch(() => null);
    if (!welcomeChannel) {
      return;
    }

    // Assign role
    if (welcomeSettings.welcomeRole) {
      const role = member.guild.roles.cache.get(welcomeSettings.welcomeRole);
      if (role) {
        await member.roles.add(role).catch(console.error);
      }
    }

    const card = await NewWelcomeCard({
        username: member.user.username,
        userPosition: 'New Member',
        avatar: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
        backgroundImage: welcomeSettings.welcomeBackgroundImage,
    });

    const attachment = new AttachmentBuilder(card, { name: 'welcome.png' });

    await welcomeChannel.send({
      content: welcomeSettings.welcomeMessage.replace('{{user}}', member),
      files: [attachment],
    });
  },
};
