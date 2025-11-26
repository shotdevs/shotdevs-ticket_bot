const { Events } = require('discord.js');
const { VcTime } = require('../models');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const userId = oldState.id;
    const guildId = oldState.guild.id;

    if (oldState.channelId && !newState.channelId) {
      // User left a voice channel
      let userVcTime = await VcTime.findOne({ guildId, userId });
      if (userVcTime && userVcTime.joinTime) {
        const timeInVC = Date.now() - userVcTime.joinTime;
        userVcTime.timeInVC += timeInVC;
        userVcTime.joinTime = null;
        await userVcTime.save();
      }
    } else if (!oldState.channelId && newState.channelId) {
      // User joined a voice channel
      let userVcTime = await VcTime.findOne({ guildId, userId });
      if (!userVcTime) {
        userVcTime = new VcTime({ guildId, userId });
      }
      userVcTime.joinTime = Date.now();
      await userVcTime.save();
    }
  },
};
