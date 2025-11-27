const { Ticket, StaffActions } = require('../models');
const { addUserToTicket } = require('./permissionManager');
const { createSuccessEmbed } = require('./embedBuilder');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

async function handleSelectMenu(interaction) {
    const [action, data] = interaction.customId.split(':');

    if (action === 'select_user') {
        const ticketId = data;
        const ticket = await Ticket.findOne({ ticketId: ticketId });

        try {
            if (!ticket) {
                return interaction.reply({ content: 'This ticket no longer exists.', flags: MessageFlags.Ephemeral });
            }

            const selectedUserId = interaction.values[0];

            // Add the selected user directly
            await addUserToTicket(interaction.channel, selectedUserId);
            ticket.participants.push(selectedUserId);
            await ticket.save();
            await StaffActions.create({
                guildId: interaction.guild.id,
                ticketId: ticket.ticketId,
                staffId: interaction.user.id,
                action: 'add_user',
                targetUserId: selectedUserId
            });

            await interaction.reply({
                content: `<@${selectedUserId}> has been added to the ticket.`,
                flags: MessageFlags.Ephemeral
            });

            // Notify in the ticket channel
            await interaction.channel.send({
                embeds: [createSuccessEmbed(`<@${selectedUserId}> has been added to the ticket by ${interaction.user.tag}.`)]
            });
        } catch (error) {
            console.error('Error in select_user handler:', error);
            try {
                await interaction.reply({
                    content: 'An error occurred while adding the user to the ticket.',
                    flags: MessageFlags.Ephemeral
                });
            } catch (replyError) {
                // Interaction likely expired
                return;
            }
        }
    }
}

module.exports = { handleSelectMenu };