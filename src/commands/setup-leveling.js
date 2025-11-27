const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { GuildConfig } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-leveling')
    .setDescription('Configure the leveling system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable the leveling system.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable the leveling system.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the level up channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send level up messages in.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-role-reward')
        .setDescription('Add a role reward for a specific level.')
        .addIntegerOption(option =>
          option
            .setName('level')
            .setDescription('The level to award the role at.')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to award.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
        subcommand
          .setName('remove-role-reward')
          .setDescription('Remove a role reward for a specific level.')
          .addIntegerOption(option =>
            option
              .setName('level')
              .setDescription('The level to remove the role reward from.')
              .setRequired(true)
          )
      ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let guildConfig = await GuildConfig.findOne({ guildId });
    if (!guildConfig) {
      guildConfig = new GuildConfig({ guildId });
    }

    if (subcommand === 'enable') {
        guildConfig.levelingEnabled = true;
        await guildConfig.save();
        await interaction.reply({
            content: 'Leveling system enabled.',
            ephemeral: true,
        });
    } else if (subcommand === 'disable') {
        guildConfig.levelingEnabled = false;
        await guildConfig.save();
        await interaction.reply({
            content: 'Leveling system disabled.',
            ephemeral: true,
        });
    } else if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('channel');
      guildConfig.levelUpChannelId = channel.id;
      await guildConfig.save();
      await interaction.reply({
        content: `Level up channel set to ${channel}.`,
        ephemeral: true,
      });
    } else if (subcommand === 'add-role-reward') {
        const level = interaction.options.getInteger('level');
        const role = interaction.options.getRole('role');

        const existingReward = guildConfig.roleRewards.find(reward => reward.level === level);
        if (existingReward) {
          return interaction.reply({
            content: `A role reward already exists for level ${level}.`,
            ephemeral: true,
          });
        }

        guildConfig.roleRewards.push({ level, roleId: role.id });
        await guildConfig.save();
        await interaction.reply({
          content: `Role reward for level ${level} set to ${role}.`,
          ephemeral: true,
        });
    } else if (subcommand === 'remove-role-reward') {
        const level = interaction.options.getInteger('level');

        guildConfig.roleRewards = guildConfig.roleRewards.filter(reward => reward.level !== level);
        await guildConfig.save();
        await interaction.reply({
          content: `Role reward for level ${level} removed.`,
          ephemeral: true,
        });
    }
  },
};
