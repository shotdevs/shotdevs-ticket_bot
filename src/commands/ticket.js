const { SlashCommandBuilder } = require('@discordjs/builders');
const { Ticket, StaffActions, CategoryConfig } = require('../models');
const { closeTicket, deleteTicket } = require('../utils/ticketClosure');
const { addUserToTicket, removeUserFromTicket, setTicketPermissions } = require('../utils/permissionManager');
const { createSuccessContainer } = require('../utils/embedBuilder');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder , MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage the current ticket.')
        .addSubcommand(subcommand => subcommand.setName('close').setDescription('Closes the current ticket.'))
        .addSubcommand(subcommand => subcommand.setName('delete').setDescription('Deletes the current ticket.'))
        .addSubcommand(subcommand => subcommand.setName('claim').setDescription('Claims the current ticket.'))
        .addSubcommand(subcommand => subcommand.setName('add').setDescription('Adds a user to the ticket.').addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('remove').setDescription('Removes a user from the ticket.').addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('reopen').setDescription('Reopens a closed ticket.'))
        .addSubcommand(subcommand => subcommand.setName('rename').setDescription('Renames the ticket channel.').addStringOption(option => option.setName('name').setDescription('The new name for the ticket channel').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('transfer').setDescription('Transfers ownership of the ticket to another user.').addUserOption(option => option.setName('user').setDescription('The user to transfer the ticket to').setRequired(true))),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id });

            if (!ticket) {
                try {
                    return await interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
                } catch (error) {
                    // Interaction likely expired
                    return;
                }
            }

            const member = await interaction.guild.members.fetch(interaction.user.id);
            const categoryConfig = await CategoryConfig.findOne({ categoryId: ticket.categoryId });
            const isStaff = member.roles.cache.some(role => categoryConfig.staffRoles.includes(role.id));
            const isCreator = ticket.creatorId === interaction.user.id;

            if (!isStaff && !isCreator && subcommand === 'close') {
                try {
                    return await interaction.reply({ content: 'You do not have permission to close this ticket.', flags: MessageFlags.Ephemeral });
                } catch (error) {
                    // Interaction likely expired
                    return;
                }
            }

            if (!isStaff && (subcommand !== 'close')) {
                try {
                    return await interaction.reply({ content: 'You do not have permission to manage this ticket.', flags: MessageFlags.Ephemeral });
                } catch (error) {
                    // Interaction likely expired
                    return;
                }
            }

            if (subcommand === 'close') {
                const modal = new ModalBuilder()
                    .setCustomId(`close_ticket:${ticket.ticketId}`)
                    .setTitle('Close Ticket');
                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel("Reason for closing")
                    .setStyle(TextInputStyle.Paragraph);
                const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(firstActionRow);
                await interaction.showModal(modal);

            } else if (subcommand === 'delete') {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await deleteTicket(interaction.client, ticket);
                    await interaction.editReply({ content: 'Ticket deleted successfully.' });
                } catch (error) {
                    console.error('Error deleting ticket:', error);
                    try {
                        await interaction.editReply({ content: 'An error occurred while deleting the ticket.' });
                    } catch (replyError) {
                        // Interaction likely expired
                        return;
                    }
                }

            } else if (subcommand === 'claim') {
                ticket.claimedBy = interaction.user.id;
                ticket.status = 'claimed';
                await ticket.save();
                await StaffActions.create({ guildId: interaction.guild.id, ticketId: ticket.ticketId, staffId: interaction.user.id, action: 'claim' });
                await interaction.reply(createSuccessContainer(`Ticket claimed by ${interaction.user.tag}.`));

            } else if (subcommand === 'add') {
                const user = interaction.options.getUser('user');
                await addUserToTicket(interaction.channel, user.id);
                ticket.participants.push(user.id);
                await ticket.save();
                await StaffActions.create({ guildId: interaction.guild.id, ticketId: ticket.ticketId, staffId: interaction.user.id, action: 'add_user', targetUserId: user.id });
                await interaction.reply(createSuccessContainer(`${user.tag} has been added to the ticket.`));

            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                await removeUserFromTicket(interaction.channel, user.id);
                ticket.participants = ticket.participants.filter(p => p !== user.id);
                await ticket.save();
                await StaffActions.create({ guildId: interaction.guild.id, ticketId: ticket.ticketId, staffId: interaction.user.id, action: 'remove_user', targetUserId: user.id });
                await interaction.reply(createSuccessContainer(`${user.tag} has been removed from the ticket.`));

            } else if (subcommand === 'reopen') {
                if (ticket.status !== 'closed') {
                    try {
                        return await interaction.reply({ content: 'This ticket is not closed.', flags: MessageFlags.Ephemeral });
                    } catch (error) {
                        // Interaction likely expired
                        return;
                    }
                }
                ticket.status = 'open';
                await ticket.save();

                const categoryConfig = await CategoryConfig.findOne({ categoryId: ticket.categoryId });
                await setTicketPermissions(interaction.channel, interaction.guild, ticket.creatorId, categoryConfig, false);

                await interaction.reply(createSuccessContainer('Ticket reopened.'));

            } else if (subcommand === 'rename') {
                const newName = interaction.options.getString('name');
                await interaction.channel.setName(newName);
                await interaction.reply(createSuccessContainer(`Ticket renamed to ${newName}.`));

            } else if (subcommand === 'transfer') {
                const newUser = interaction.options.getUser('user');
                const oldCreatorId = ticket.creatorId;
                ticket.creatorId = newUser.id;

                const categoryConfig = await CategoryConfig.findOne({ categoryId: ticket.categoryId });
                await removeUserFromTicket(interaction.channel, oldCreatorId);
                await addUserToTicket(interaction.channel, newUser.id);

                await ticket.save();
                await interaction.reply(createSuccessContainer(`Ticket transferred to ${newUser.tag}.`));
            }
        } catch (error) {
            console.error('Error in ticket command:', error);
            try {
                // Try to send an error message, but this might fail if the interaction expired
                await interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
            } catch (replyError) {
                // Interaction likely expired, which is fine
                return;
            }
        }
    },
};
