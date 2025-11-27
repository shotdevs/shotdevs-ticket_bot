const { closeTicket } = require('./ticketClosure');
const { Ticket, StaffActions } = require('../models');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { createTicket } = require('./ticketCreation');
const { CategoryConfig } = require('../models');
const { createSuccessContainer } = require('./embedBuilder');

async function handleButton(interaction) {
    const [action, data] = interaction.customId.split(':');

    if (action === 'create_ticket') {
        const categoryId = data;
        const category = await CategoryConfig.findOne({ categoryId: categoryId, guildId: interaction.guild.id });

        if (!category) {
            try {
                return interaction.reply({ content: 'This ticket category no longer exists.', flags: 64 });
            } catch (error) {
                // Interaction likely expired
                return;
            }
        }

        const modal = new ModalBuilder()
            .setCustomId(`create_ticket:${categoryId}`)
            .setTitle(category.name);

        if (category.modalFields && category.modalFields.length > 0) {
            for (const field of category.modalFields) {
                const textInput = new TextInputBuilder()
                    .setCustomId(field.label.toLowerCase().replace(/\\s+/g, '_'))
                    .setLabel(field.label)
                    .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                    .setRequired(field.required);
                if (field.placeholder) textInput.setPlaceholder(field.placeholder);
                if (field.minLength) textInput.setMinLength(field.minLength);
                if (field.maxLength) textInput.setMaxLength(field.maxLength);

                modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            }
        } else {
             const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel("Please describe your issue")
                .setStyle(TextInputStyle.Paragraph);
            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        }

        try {
            await interaction.showModal(modal);
        } catch (error) {
            // Interaction likely expired
            return;
        }

    } else if (action === 'close_ticket') {
        const ticketId = data;
        const modal = new ModalBuilder()
            .setCustomId(`close_ticket_reason:${ticketId}`)
            .setTitle('Close Ticket');
        const reasonInput = new TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel("Reason for closing")
            .setStyle(TextInputStyle.Paragraph);
        const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(firstActionRow);
        
        try {
            await interaction.showModal(modal);
        } catch (error) {
            // Interaction likely expired
            return;
        }
    } else if (action === 'claim_ticket') {
        const ticketId = data;
        const ticket = await Ticket.findOne({ ticketId: ticketId });
        
        try {
            if (!ticket) {
                return interaction.reply({ content: 'This ticket no longer exists.', flags: 64 });
            }
            if (ticket.claimedBy) {
                return interaction.reply({ content: `This ticket has already been claimed by <@${ticket.claimedBy}>.`, flags: 64 });
            }
        } catch (error) {
            // Interaction likely expired
            return;
        }
        
        ticket.claimedBy = interaction.user.id;
        ticket.status = 'claimed';
        await ticket.save();
        
        try {
            await interaction.reply({ content: `You have claimed this ticket.`, flags: 64 });
            await interaction.channel.send(createSuccessContainer(`Ticket claimed by ${interaction.user.tag}.`));
            await StaffActions.create({ guildId: interaction.guild.id, ticketId: ticket.ticketId, staffId: interaction.user.id, action: 'claim' });
        } catch (error) {
            // Interaction likely expired, but we still want to save the claim
            return;
        }
    } else if (action === 'add_user') {
        const ticketId = data;
        const ticket = await Ticket.findOne({ ticketId: ticketId });
        
        try {
            if (!ticket) {
                return interaction.reply({ content: 'This ticket no longer exists.', flags: MessageFlags.Ephemeral });
            }
            
            // Check if user has permission to add users (creator or staff)
            const member = await interaction.guild.members.fetch(interaction.user.id);
            const categoryConfig = await CategoryConfig.findOne({ categoryId: ticket.categoryId });
            const isStaff = member.roles.cache.some(role => categoryConfig.staffRoles.includes(role.id));
            const isCreator = ticket.creatorId === interaction.user.id;
            
            if (!isStaff && !isCreator) {
                return interaction.reply({ content: 'You do not have permission to add users to this ticket.', flags: MessageFlags.Ephemeral });
            }
            
            // Fetch members from the guild (limit to 25 for select menu limit)
            const members = await interaction.guild.members.fetch();
            const memberOptions = members
                .filter(member => !member.user.bot && member.id !== ticket.creatorId)
                .first(25)
                .map(member => ({
                    label: member.user.username,
                    value: member.id,
                    description: `Add ${member.user.username} to the ticket`
                }));
            
            if (memberOptions.length === 0) {
                return interaction.reply({ 
                    content: 'No users available to add to this ticket.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
            
            // Create a user selection menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_user:${ticketId}`)
                .setPlaceholder('Select a user to add to the ticket')
                .setMaxValues(1)
                .addOptions(memberOptions);
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            await interaction.reply({ 
                content: 'Select a user to add to the ticket:', 
                components: [row],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            // Interaction likely expired
            console.error('Error in add_user button handler:', error);
            return;
        }
    } else if (action === 'delete_ticket') {
        const ticketId = data;
        const ticket = await Ticket.findOne({ ticketId: ticketId });
        
        try {
            if (!ticket) {
                return interaction.reply({ content: 'This ticket no longer exists.', flags: 64 });
            }
            
            // Confirm deletion with a modal
            const modal = new ModalBuilder()
                .setCustomId(`confirm_delete:${ticketId}`)
                .setTitle('Confirm Ticket Deletion');
                
            const confirmInput = new TextInputBuilder()
                .setCustomId('confirmation')
                .setLabel("Type 'DELETE' to confirm")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder("Type DELETE to confirm deletion");
                
            modal.addComponents(new ActionRowBuilder().addComponents(confirmInput));
            
            await interaction.showModal(modal);
        } catch (error) {
            // Interaction likely expired
            return;
        }
    }
}

module.exports = { handleButton };
