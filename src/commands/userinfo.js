const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to get information about.')
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle(`${user.tag}'s Info`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Joined Server', value: member.joinedAt.toDateString(), inline: true },
        { name: 'Account Created', value: user.createdAt.toDateString(), inline: true },
        { name: 'Roles', value: member.roles.cache.map(role => role.toString()).join(' ') }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
