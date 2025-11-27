const { SlashCommandBuilder } = require('@discordjs/builders');
const { CategoryConfig } = require('../models');
const { createPanelContainer, COMPONENT_FLAGS } = require('../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { ButtonStyle , MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Creates a ticket panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option => option.setName('channel').setDescription('The channel to send the panel to').setRequired(true))
        .addStringOption(option => option.setName('title').setDescription('The title of the panel embed'))
        .addStringOption(option => option.setName('description').setDescription('The description of the panel embed'))
        .addStringOption(option => option.setName('color').setDescription('The color of the panel embed (hex code)')),

    async execute(interaction) {
        let interactionReplyAvailable = true;
        try {
            // Use the supported discord.js option `flags: MessageFlags.Ephemeral` instead of
            // passing raw flags. Passing `flags` here can produce malformed
            // requests and lead to `Unknown interaction` errors from the API.
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Failed to defer reply:', error);
            // If the interaction is unknown/expired (10062), we can't use the
            // interaction token to reply. Log and continue — we'll still try
            // to perform the primary action (posting the panel) and provide a
            // fallback notification in the channel if possible.
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                // Other errors are likely fatal for replying; stop to avoid
                // further confusing errors.
                return;
            }
        }

        try {
            const channel = interaction.options.getChannel('channel');
            const title = interaction.options.getString('title') || 'Create a Ticket';
            const description = interaction.options.getString('description') || 'Click a button below to create a ticket.';
            const color = interaction.options.getString('color') || '#5865F2';

            const categories = await CategoryConfig.find({ guildId: interaction.guild.id, enabled: true });

            if (!categories.length) {
                return interaction.editReply({ content: 'No enabled ticket categories found for this server.' });
            }

            const buttons = [];
            for (const category of categories) {
                let buttonStyle;
                switch (category.buttonColor) {
                    case 'secondary':
                        buttonStyle = ButtonStyle.Secondary;
                        break;
                    case 'success':
                        buttonStyle = ButtonStyle.Success;
                        break;
                    case 'danger':
                        buttonStyle = ButtonStyle.Danger;
                        break;
                    default:
                        buttonStyle = ButtonStyle.Primary;
                        break;
                }
                
                const button = {
                    type: 2,
                    custom_id: `create_ticket:${category.categoryId}`,
                    label: category.name,
                    style: buttonStyle
                };
                // Normalize emoji values from the database to a form accepted by the API.
                // Stored values might be:
                // - Unicode emoji like '🎫' -> { name: '🎫' }
                // - Custom emoji markup like '<:name:123456789>' or '<a:name:123>' -> { id: '123456789', name: 'name' }
                // - Raw snowflake id '123456789' -> { id: '123456789' }
                // - Shortcodes like ':smile:' are not reliably supported without a mapping, so we skip them.
                if (category.emoji) {
                    const raw = String(category.emoji).trim();
                    // custom emoji: <:, <a:
                    const customMatch = raw.match(/^<a?:([^:>]+):(\d+)>$/);
                    if (customMatch) {
                        const [, name, id] = customMatch;
                        button.emoji = { id, name };
                    } else if (/^\d+$/.test(raw)) {
                        // raw snowflake id
                        button.emoji = { id: raw };
                    } else if (/^:[^:]+:$/.test(raw)) {
                        // shortcode like :smile: - we can't reliably convert shortcodes to unicode here
                        console.warn(`Panel command: emoji value appears to be a shortcode and will be ignored: ${raw}`);
                    } else {
                        // treat as unicode emoji (or any string) -- Discord accepts unicode in the name field
                        button.emoji = { name: raw };
                    }
                }
                buttons.push(button);
            }

            const payload = createPanelContainer(title, description, color, buttons);
            await channel.send(payload);

            // Confirm to the user that the panel was created. If the
            // interaction token is no longer available (expired/unknown),
            // don't attempt to ping the user (avoid noisy pings). We will
            // only send a plain confirmation message to the channel if the
            // interaction cannot be replied to.
            if (interactionReplyAvailable) {
                await interaction.editReply({ content: 'Panel created successfully.' });
            } else {
                try {
                    await interaction.channel?.send({ content: 'Panel created successfully.' });
                } catch (fallbackError) {
                    console.error('Failed to send fallback confirmation message:', fallbackError);
                }
            }
        } catch (error) {
            console.error('Error in panel command:', error);
            try {
                if (interactionReplyAvailable) {
                    await interaction.editReply({ content: 'An error occurred while creating the panel. Please check the bot permissions and try again.' });
                } else {
                    // Avoid pinging the user; provide a plain channel notification.
                    await interaction.channel?.send({ content: 'An error occurred while creating the panel. Please check the bot permissions and try again.' });
                }
            } catch (replyError) {
                // If still failing, log and move on
                console.error('Failed to send error message:', replyError);
            }
        }
    },
};

