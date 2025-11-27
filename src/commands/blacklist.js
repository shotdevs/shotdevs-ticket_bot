const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildConfig } = require('../models');
const { createSuccessContainer, createInfoContainer } = require('../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord-api-types/v10');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the server blacklist.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-user')
                .setDescription('Adds a user to the blacklist.')
                .addUserOption(option => option.setName('user').setDescription('The user to blacklist').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-user')
                .setDescription('Removes a user from the blacklist.')
                .addUserOption(option => option.setName('user').setDescription('The user to unblacklist').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists blacklisted users and roles.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-role')
                .setDescription('Adds a role to the blacklist.')
                .addRoleOption(option => option.setName('role').setDescription('The role to blacklist').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-role')
                .setDescription('Removes a role from the blacklist.')
                .addRoleOption(option => option.setName('role').setDescription('The role to unblacklist').setRequired(true))
        ),

    async execute(interaction) {
        let interactionReplyAvailable = true;
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Failed to defer reply (blacklist):', error);
            if (error && error.code === 10062) {
                interactionReplyAvailable = false;
            } else {
                return;
            }
        }
        const subcommand = interaction.options.getSubcommand();
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });

        if (subcommand === 'add-user') {
            const user = interaction.options.getUser('user');
            if (!guildConfig.blacklistedUsers.includes(user.id)) {
                guildConfig.blacklistedUsers.push(user.id);
                await guildConfig.save();
            }
            if (interactionReplyAvailable) await interaction.editReply(createSuccessContainer(`${user.tag} has been blacklisted.`));
            else await interaction.channel?.send({ content: `${user.tag} has been blacklisted.` });
        } else if (subcommand === 'remove-user') {
            const user = interaction.options.getUser('user');
            guildConfig.blacklistedUsers = guildConfig.blacklistedUsers.filter(id => id !== user.id);
            await guildConfig.save();
            if (interactionReplyAvailable) await interaction.editReply(createSuccessContainer(`${user.tag} has been unblacklisted.`));
            else await interaction.channel?.send({ content: `${user.tag} has been unblacklisted.` });
        } else if (subcommand === 'add-role') {
            const role = interaction.options.getRole('role');
            if (!guildConfig.blacklistedRoles.includes(role.id)) {
                guildConfig.blacklistedRoles.push(role.id);
                await guildConfig.save();
            }
            if (interactionReplyAvailable) await interaction.editReply(createSuccessContainer(`${role.name} has been blacklisted.`));
            else await interaction.channel?.send({ content: `${role.name} has been blacklisted.` });
        } else if (subcommand === 'remove-role') {
            const role = interaction.options.getRole('role');
            guildConfig.blacklistedRoles = guildConfig.blacklistedRoles.filter(id => id !== role.id);
            await guildConfig.save();
            if (interactionReplyAvailable) await interaction.editReply(createSuccessContainer(`${role.name} has been unblacklisted.`));
            else await interaction.channel?.send({ content: `${role.name} has been unblacklisted.` });
        } else if (subcommand === 'list') {
            const blacklistedUsers = guildConfig.blacklistedUsers.map(id => `<@${id}>`).join(', ');
            const blacklistedRoles = guildConfig.blacklistedRoles.map(id => `<@&${id}>`).join(', ');
            const description = `**Users:** ${blacklistedUsers || 'None'}\n**Roles:** ${blacklistedRoles || 'None'}`;
            const payload = createInfoContainer('Blacklist', description);
            if (interactionReplyAvailable) await interaction.editReply(payload);
            else await interaction.channel?.send(payload);
        }
    },
};

