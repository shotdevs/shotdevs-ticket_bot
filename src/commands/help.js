const { SlashCommandBuilder } = require('@discordjs/builders');
const { createInfoContainer, COMPONENT_FLAGS } = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays information about the bot and its commands.'),

    async execute(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const isAdmin = member.permissions.has('Administrator');
        const isStaff = member.permissions.has('ManageChannels');

        let description = 'Here is a list of available commands:\n\n';
        
        if (isAdmin) {
            description += '**🛠️ Admin Commands**\n`/setup`, `/category`, `/panel`, `/blacklist`\n\n';
        }
        if (isStaff) {
            description += '**👮 Staff Commands**\n`/ticket`, `/tickets`, `/transcript`\n\n';
        }
        description += '**👥 User Commands**\n`/help`, create tickets via panels';

        const payload = createInfoContainer('Vazha 3.0 Help', description);
        await interaction.reply(payload);
    },
};

