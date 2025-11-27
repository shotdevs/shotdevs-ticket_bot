const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for banning the user.')
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id);
    if (!member.bannable) {
      return interaction.reply({
        content: 'I cannot ban this user.',
        ephemeral: true,
      });
    }

    await member.ban({ reason });

    await interaction.reply({
      content: `Banned ${user.tag} for: ${reason}`,
    });
  },
};
