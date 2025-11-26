const { Ticket, Leveling, GuildConfig } = require('../models');
const { Collection } = require('discord.js');

const cooldowns = new Collection();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // Ticket activity logic
        try {
            const ticket = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
            if (ticket) {
                ticket.lastActivity = new Date();
                ticket.messages.push({
                    authorId: message.author.id,
                    content: message.content.substring(0, 2000),
                    attachments: message.attachments.map(a => a.url),
                });

                if (!ticket.participants.includes(message.author.id)) {
                    ticket.participants.push(message.author.id);
                }

                await ticket.save();
            }
        } catch (error) {
            console.error('Error updating ticket activity:', error);
        }

        // Leveling system logic
        try {
            const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
            if (!guildConfig || !guildConfig.levelingEnabled) {
                return;
            }

            const cooldownAmount = 60 * 1000; // 60 seconds
            const now = Date.now();
            const timestamps = cooldowns.get(message.author.id) || 0;

            if (now < timestamps) return;

            cooldowns.set(message.author.id, now + cooldownAmount);

            const xpAmount = Math.floor(Math.random() * 11) + 15; // 15 to 25 XP

            let userLevel = await Leveling.findOne({
                guildId: message.guild.id,
                userId: message.author.id,
            });

            if (!userLevel) {
                userLevel = new Leveling({
                    guildId: message.guild.id,
                    userId: message.author.id,
                });
            }

            userLevel.xp += xpAmount;
            const xpToNextLevel = 5 * (userLevel.level ** 2) + 50 * userLevel.level + 100;

            if (userLevel.xp >= xpToNextLevel) {
                userLevel.level += 1;
                userLevel.xp = 0; // or userLevel.xp - xpToNextLevel;

                const levelUpChannel = await message.guild.channels.fetch(guildConfig.levelUpChannelId).catch(() => null);
                if (levelUpChannel) {
                    levelUpChannel.send(`Congratulations ${message.author}, you have reached level ${userLevel.level}!`);
                }

                const roleReward = guildConfig.roleRewards.find(reward => reward.level === userLevel.level);
                if (roleReward) {
                    const role = message.guild.roles.cache.get(roleReward.roleId);
                    if (role) {
                        await message.member.roles.add(role).catch(console.error);
                    }
                }
            }

            await userLevel.save();
        } catch (error) {
            console.error('Error in leveling system:', error);
        }
    },
};
