const { GuildConfig, Ticket, UserStats } = require('../models');
const { formatTicketName, formatDuration } = require('./formatters');
const { setTicketPermissions } = require('./permissionManager');
const { createTicketContainer } = require('./embedBuilder');
const { checkRateLimit } = require('./rateLimiter');
const { notifyTicketCreated } = require('./dmNotifier');
const { logTicketAction } = require('./auditLogger');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

async function createTicket(client, guild, user, category, modalResponses) {
    // Dynamic import for ES Module uuid
    const { v4: uuidv4 } = await import('uuid');

    const guildConfig = await GuildConfig.findOne({ guildId: guild.id });

    // Blacklist check
    if (guildConfig.blacklistedUsers.includes(user.id)) {
        throw new Error('You are blacklisted from creating tickets.');
    }

    const rateLimit = await checkRateLimit(client, user.id, guild.id);
    if (rateLimit.limited) {
        throw new Error(`You are on cooldown. Please wait ${formatDuration(rateLimit.remainingTime)}.`);
    }

    const ticketId = uuidv4();
    guildConfig.ticketCounter += 1;
    await guildConfig.save();

    const channelName = formatTicketName(category.namingScheme, {
        username: user.username,
        userid: user.id,
        increment: guildConfig.ticketCounter,
        category: category.name,
        shortid: ticketId.substring(0, 8),
    });

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.discordCategoryId,
    });

    await setTicketPermissions(channel, guild, user.id, category);

    const ticket = new Ticket({
        ticketId,
        guildId: guild.id,
        categoryId: category.categoryId,
        channelId: channel.id,
        creatorId: user.id,
        modalResponses,
        participants: [user.id],
    });
    await ticket.save();

    const buttons = [
        { type: 2, custom_id: `close_ticket:${ticket.ticketId}`, label: '🔒 Close', style: ButtonStyle.Danger },
        { type: 2, custom_id: `claim_ticket:${ticket.ticketId}`, label: '✅ Claim', style: ButtonStyle.Success },
        { type: 2, custom_id: `add_user:${ticket.ticketId}`, label: '👥 Add User', style: ButtonStyle.Primary }
    ];

    const payload = createTicketContainer(ticket, buttons);
    payload.content = `${category.autoGreeting} <@${user.id}>`;
    await channel.send(payload);

    await notifyTicketCreated(client, user.id, ticket, guildConfig);
    // await logTicketAction(...);

    const userStats = await UserStats.findOneAndUpdate(
        { userId: user.id, guildId: guild.id },
        { $inc: { ticketsCreated: 1 }, $set: { lastTicketCreated: new Date() }, $push: { activeTickets: ticket.ticketId } },
        { upsert: true, new: true }
    );

    return ticket;
}

module.exports = { createTicket };
