const { SlashCommandBuilder } = require('@discordjs/builders');
const { Ticket, UserStats } = require('../models');
const { createInfoContainer, createStatsContainer } = require('../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord-api-types/v10');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('View ticket information.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists tickets in the server.')
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('Filter by ticket status')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Open', value: 'open' },
                            { name: 'Closed', value: 'closed' },
                            { name: 'All', value: 'all' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription("Views a user's tickets.")
                .addUserOption(option => option.setName('user').setDescription('The user to view tickets for').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View ticket statistics.')
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            const status = interaction.options.getString('status') || 'open';
            const query = { guildId: interaction.guild.id };
            if (status !== 'all') {
                query.status = status;
            }
            const tickets = await Ticket.find(query).limit(10);
            const payload = createInfoContainer('Ticket List', tickets.length ? tickets.map(t => `**ID:** ${t.ticketId} | **Creator:** <@${t.creatorId}> | **Status:** ${t.status}`).join('\n') : 'No tickets found.');
            await interaction.editReply(payload);

        } else if (subcommand === 'user') {
            const user = interaction.options.getUser('user');
            const tickets = await Ticket.find({ guildId: interaction.guild.id, creatorId: user.id }).limit(10);
            const payload = createInfoContainer(`Tickets for ${user.tag}`, tickets.length ? tickets.map(t => `**ID:** ${t.ticketId} | **Status:** ${t.status}`).join('\n') : 'No tickets found for this user.');
            await interaction.editReply(payload);

        } else if (subcommand === 'stats') {
            const totalTickets = await Ticket.countDocuments({ guildId: interaction.guild.id });
            const openTickets = await Ticket.countDocuments({ guildId: interaction.guild.id, status: 'open' });
            const closedTickets = await Ticket.countDocuments({ guildId: interaction.guild.id, status: 'closed' });
            const userStats = await UserStats.aggregate([
                { $match: { guildId: interaction.guild.id } },
                { $group: { _id: null, totalCreated: { $sum: "$ticketsCreated" }, totalClosed: { $sum: "$ticketsClosed" } } }
            ]);

            const stats = {
                totalTickets,
                openTickets,
                closedTickets,
                totalCreated: userStats[0]?.totalCreated || 0,
                totalClosed: userStats[0]?.totalClosed || 0,
            };

            const payload = createStatsContainer(stats);
            await interaction.editReply(payload);
        }
    },
};

