const { CategoryConfig, Ticket } = require('../models');
const { createTicket } = require('./ticketCreation');
const { closeTicket, deleteTicket } = require('./ticketClosure');
const { MessageFlags } = require('discord.js');

async function handleModal(interaction) {
    const [action, data] = interaction.customId.split(':');

    if (action === 'create_ticket') {
        let interactionReplyAvailable = true;
        try {
            // Check if interaction is already acknowledged
            if (interaction.replied || interaction.deferred) {
                interactionReplyAvailable = false;
            } else {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Failed to defer reply (modal create_ticket):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }

        const categoryId = data;
        const category = await CategoryConfig.findOne({ categoryId: categoryId, guildId: interaction.guild.id });

        const modalResponses = {};
        for (const field of interaction.fields.components) {
            const textInput = field.components[0];
            modalResponses[textInput.customId] = textInput.value;
        }

        try {
            const ticket = await createTicket(interaction.client, interaction.guild, interaction.user, category, modalResponses);
            // Respond via interaction if possible, otherwise fall back to a channel message
            if (interactionReplyAvailable) {
                await interaction.editReply({ content: `Ticket created: <#${ticket.channelId}>` });
            } else {
                try {
                    await interaction.channel?.send({ content: `Ticket created: <#${ticket.channelId}>` });
                } catch (sendErr) {
                    console.error('Failed fallback channel message after ticket creation:', sendErr);
                }
            }
        } catch (error) {
            if (interactionReplyAvailable) {
                try {
                    await interaction.editReply({ content: `Error creating ticket: ${error.message}` });
                } catch (replyError) {
                    console.error('Failed to send error reply (modal create_ticket):', replyError);
                }
            } else {
                try {
                    await interaction.channel?.send({ content: `Error creating ticket: ${error.message}` });
                } catch (sendErr) {
                    console.error('Failed fallback channel message for error (modal create_ticket):', sendErr);
                }
            }
        }

    } else if (action === 'close_ticket_reason' || action === 'close_ticket') {
        let interactionReplyAvailable = true;
        try {
            // Check if interaction is already acknowledged
            if (interaction.replied || interaction.deferred) {
                interactionReplyAvailable = false;
            } else {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Failed to defer reply (modal close_ticket):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }

        const ticketId = data;
        const reason = interaction.fields.getTextInputValue('close_reason');
        const ticket = await Ticket.findOne({ ticketId: ticketId });

        if (!ticket) {
            if (interactionReplyAvailable) {
                try {
                    return await interaction.editReply({ content: 'Ticket not found.' });
                } catch (replyError) {
                    console.error('Failed to send ticket not found reply (modal close_ticket):', replyError);
                    return;
                }
            } else {
                try {
                    return await interaction.channel?.send({ content: 'Ticket not found.' });
                } catch (sendErr) {
                    console.error('Failed fallback channel message (ticket not found):', sendErr);
                    return;
                }
            }
        }

        try {
            await closeTicket(interaction.client, ticket, interaction.user, reason);

            // Respond or fallback to channel message
            if (interactionReplyAvailable) {
                try {
                    await interaction.editReply({ content: 'Ticket closed.' });
                } catch (replyError) {
                    console.error('Failed to send closed confirmation (modal):', replyError);
                }
            } else {
                try {
                    await interaction.channel?.send({ content: 'Ticket closed.' });
                } catch (sendErr) {
                    console.error('Failed fallback channel message (ticket closed):', sendErr);
                }
            }
        } catch (error) {
            if (interactionReplyAvailable) {
                try {
                    await interaction.editReply({ content: `Error closing ticket: ${error.message}` });
                } catch (replyError) {
                    console.error('Failed to send error reply (modal close_ticket):', replyError);
                }
            } else {
                try {
                    await interaction.channel?.send({ content: `Error closing ticket: ${error.message}` });
                } catch (sendErr) {
                    console.error('Failed fallback channel message for error (modal close_ticket):', sendErr);
                }
            }
        }
    } else if (action === 'confirm_delete') {
        let interactionReplyAvailable = true;
        try {
            // Check if interaction is already acknowledged
            if (interaction.replied || interaction.deferred) {
                interactionReplyAvailable = false;
            } else {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Failed to defer reply (modal confirm_delete):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }

        const ticketId = data;
        const confirmation = interaction.fields.getTextInputValue('confirmation');

        if (confirmation !== 'DELETE') {
            if (interactionReplyAvailable) {
                try {
                    return await interaction.editReply({ content: 'Deletion not confirmed. Please type DELETE to confirm.' });
                } catch (replyError) {
                    console.error('Failed to send deletion not confirmed reply (modal):', replyError);
                    return;
                }
            } else {
                try {
                    return await interaction.channel?.send({ content: 'Deletion not confirmed. Please type DELETE to confirm.' });
                } catch (sendErr) {
                    console.error('Failed fallback channel message (deletion not confirmed):', sendErr);
                    return;
                }
            }
        }

        const ticket = await Ticket.findOne({ ticketId: ticketId });

        if (!ticket) {
            if (interactionReplyAvailable) {
                try {
                    return await interaction.editReply({ content: 'Ticket not found.' });
                } catch (replyError) {
                    console.error('Failed to send ticket not found reply (modal confirm_delete):', replyError);
                    return;
                }
            } else {
                try {
                    return await interaction.channel?.send({ content: 'Ticket not found.' });
                } catch (sendErr) {
                    console.error('Failed fallback channel message (ticket not found confirm_delete):', sendErr);
                    return;
                }
            }
        }

        try {
            await deleteTicket(interaction.client, ticket);

            if (interactionReplyAvailable) {
                try {
                    await interaction.editReply({ content: 'Ticket deleted.' });
                } catch (replyError) {
                    console.error('Failed to send ticket deleted reply (modal):', replyError);
                }
            } else {
                try {
                    await interaction.channel?.send({ content: 'Ticket deleted.' });
                } catch (sendErr) {
                    console.error('Failed fallback channel message (ticket deleted):', sendErr);
                }
            }
        } catch (error) {
            if (interactionReplyAvailable) {
                try {
                    await interaction.editReply({ content: `Error deleting ticket: ${error.message}` });
                } catch (replyError) {
                    console.error('Failed to send error reply (modal confirm_delete):', replyError);
                }
            } else {
                try {
                    await interaction.channel?.send({ content: `Error deleting ticket: ${error.message}` });
                } catch (sendErr) {
                    console.error('Failed fallback channel message for error (modal confirm_delete):', sendErr);
                }
            }
        }
    }
}

module.exports = { handleModal };
