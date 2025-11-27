const { SlashCommandBuilder } = require('@discordjs/builders');
const { CategoryConfig } = require('../models');
const { createSuccessContainer, createErrorContainer, createInfoContainer } = require('../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { ChannelType, ButtonStyle , MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('category')
        .setDescription('Manage ticket categories.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new ticket category.')
                .addStringOption(option => option.setName('name').setDescription('The name of the category').setRequired(true))
                .addChannelOption(option =>
                    option.setName('discord-category')
                        .setDescription('The Discord category to create tickets in')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('A description for the category'))
                .addStringOption(option => option.setName('emoji').setDescription('An emoji for the category button'))
                .addStringOption(option => 
                    option.setName('button-color')
                        .setDescription('The color of the category button')
                        .addChoices(
                            { name: 'Primary (Blue)', value: 'primary' },
                            { name: 'Secondary (Grey)', value: 'secondary' },
                            { name: 'Success (Green)', value: 'success' },
                            { name: 'Danger (Red)', value: 'danger' }
                        ))
                .addRoleOption(option => option.setName('role1').setDescription('First staff role'))
                .addRoleOption(option => option.setName('role2').setDescription('Second staff role'))
                .addRoleOption(option => option.setName('role3').setDescription('Third staff role'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edits an existing ticket category.')
                .addStringOption(option => option.setName('category-id').setDescription('The ID of the category to edit').setRequired(true))
                .addStringOption(option => option.setName('name').setDescription('The new name of the category'))
                .addStringOption(option => 
                    option.setName('button-color')
                        .setDescription('The color of the category button')
                        .addChoices(
                            { name: 'Primary (Blue)', value: 'primary' },
                            { name: 'Secondary (Grey)', value: 'secondary' },
                            { name: 'Success (Green)', value: 'success' },
                            { name: 'Danger (Red)', value: 'danger' }
                        ))
                .addRoleOption(option => option.setName('role1').setDescription('First staff role'))
                .addRoleOption(option => option.setName('role2').setDescription('Second staff role'))
                .addRoleOption(option => option.setName('role3').setDescription('Third staff role'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes a ticket category.')
                .addStringOption(option => option.setName('category-id').setDescription('The ID of the category to delete').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all ticket categories in the server.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggles a ticket category on or off.')
                .addStringOption(option => option.setName('category-id').setDescription('The ID of the category to toggle').setRequired(true))
                .addBooleanOption(option => option.setName('enabled').setDescription('Whether the category should be enabled').setRequired(true))
        ),

    async execute(interaction) {
        let interactionReplyAvailable = true;
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Failed to defer reply (category):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const discordCategory = interaction.options.getChannel('discord-category');
            const description = interaction.options.getString('description');
            const emoji = interaction.options.getString('emoji');
            const buttonColor = interaction.options.getString('button-color') || 'primary';
            const staffRoles = [
                interaction.options.getRole('role1'),
                interaction.options.getRole('role2'),
                interaction.options.getRole('role3'),
            ].filter(Boolean).map(r => r.id);

            try {
                // Generate a unique categoryId using timestamp and random number to ensure global uniqueness
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 10000);
                const categoryId = `${name.toLowerCase().replace(/\\s+/g, '-')}-${timestamp}-${randomNum}`;
                
                const newCategory = new CategoryConfig({
                    guildId: interaction.guild.id,
                    categoryId: categoryId,
                    name: name,
                    discordCategoryId: discordCategory.id,
                    description: description,
                    emoji: emoji,
                    buttonColor: buttonColor,
                    staffRoles: staffRoles,
                });
                await newCategory.save();
                if (interactionReplyAvailable) {
                    await interaction.editReply(createSuccessContainer(`Category "${name}" created successfully with ID: ${categoryId}`));
                } else {
                    await interaction.channel?.send({ content: `Category "${name}" created successfully with ID: ${categoryId}` });
                }
            } catch (error) {
                // Handle Mongo duplicate key error (E11000) gracefully.
                if (error && (error.code === 11000 || (error.name === 'MongoError' && error.code === 11000))) {
                    // This can happen if there is a conflicting unique index in the DB
                    // (for example, a global unique on categoryId). Inform the user and
                    // suggest migration steps.
                    if (interactionReplyAvailable) {
                        return interaction.editReply(createErrorContainer('Error creating category: a category with that ID already exists. The database currently enforces unique category IDs across all servers. To allow the same category IDs in multiple servers, remove the global unique index on `categoryId` and create a compound unique index on `{ guildId, categoryId }`.'));
                    } else {
                        return interaction.channel?.send({ content: 'Error creating category: a category with that ID already exists.' });
                    }
                }
                if (interactionReplyAvailable) {
                    await interaction.editReply(createErrorContainer(`Error creating category: ${error.message}`));
                } else {
                    await interaction.channel?.send({ content: `Error creating category: ${error.message}` });
                }
            }
        } else if (subcommand === 'edit') {
            const categoryId = interaction.options.getString('category-id');
            const newName = interaction.options.getString('name');
            const newButtonColor = interaction.options.getString('button-color');
            const newStaffRoles = [
                interaction.options.getRole('role1'),
                interaction.options.getRole('role2'),
                interaction.options.getRole('role3'),
            ].filter(Boolean).map(r => r.id);
            const category = await CategoryConfig.findOne({ categoryId: categoryId, guildId: interaction.guild.id });
            if (!category) {
                return interaction.editReply(createErrorContainer('Category not found.'));
            }
            if (newName) category.name = newName;
            if (newButtonColor) category.buttonColor = newButtonColor;
            if (newStaffRoles.length > 0) category.staffRoles = newStaffRoles;
            await category.save();
            await interaction.editReply(createSuccessContainer(`Category "${category.name}" (ID: ${category.categoryId}) updated successfully.`));
        } else if (subcommand === 'delete') {
            const categoryId = interaction.options.getString('category-id');
            await CategoryConfig.deleteOne({ categoryId: categoryId, guildId: interaction.guild.id });
            await interaction.editReply(createSuccessContainer('Category deleted successfully.'));
        } else if (subcommand === 'list') {
            const categories = await CategoryConfig.find({ guildId: interaction.guild.id });
            const categoryList = categories.map(c => `**ID:** ${c.categoryId} | **Name:** ${c.name} | **Enabled:** ${c.enabled} | **Button Color:** ${c.buttonColor}`).join('\n');
            const payload = createInfoContainer('Category List', categoryList || 'No categories found.');
            await interaction.editReply(payload);
        } else if (subcommand === 'toggle') {
            const categoryId = interaction.options.getString('category-id');
            const enabled = interaction.options.getBoolean('enabled');
            const category = await CategoryConfig.findOne({ categoryId: categoryId, guildId: interaction.guild.id });
            if (!category) {
                return interaction.editReply(createErrorContainer('Category not found.'));
            }
            category.enabled = enabled;
            await category.save();
            await interaction.editReply(createSuccessContainer(`Category "${category.name}" has been ${enabled ? 'enabled' : 'disabled'}.`));
        }
    },
};

