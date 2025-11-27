const { SlashCommandBuilder } = require('@discordjs/builders');
const { Ticket } = require('../models');
const { generateTranscript } = require('../utils/transcriptGenerator');
const { AttachmentBuilder , MessageFlags } = require('discord.js');
const { PermissionFlagsBits } = require('discord-api-types/v10');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transcript')
        .setDescription('Manually generates a transcript for a ticket.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option => option.setName('ticket-id').setDescription('The ID of the ticket to generate a transcript for')),

    async execute(interaction) {
        let interactionReplyAvailable = true;
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Failed to defer reply (transcript):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }

        const ticketId = interaction.options.getString('ticket-id');
        let ticket;

        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId: ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        }

        if (!ticket) {
            if (interactionReplyAvailable) return interaction.editReply({ content: 'Ticket not found.' });
            return interaction.channel?.send({ content: 'Ticket not found.' });
        }

        const transcript = await generateTranscript(ticket);
        const attachment = new AttachmentBuilder(Buffer.from(transcript), { name: `transcript-${ticket.ticketId}.html` });

    if (interactionReplyAvailable) await interaction.editReply({ files: [attachment] });
    else await interaction.channel?.send({ content: 'Transcript generated.', files: [attachment] });
    },
};

