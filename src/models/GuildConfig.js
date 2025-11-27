const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, default: '!' },
    defaultStaffRoles: { type: [String], default: [] },
    defaultLogChannel: { type: String, default: null },
    ticketCounter: { type: Number, default: 0 },
    rateLimit: {
        enabled: { type: Boolean, default: false },
        cooldown: { type: Number, default: 300000 }, // 5 minutes
        bypassRoles: { type: [String], default: [] }
    },
    dmNotifications: {
        onCreate: { type: Boolean, default: true },
        onClose: { type: Boolean, default: true },
        onDelete: { type: Boolean, default: true },
        onTransfer: { type: Boolean, default: true }
    },
    autoClose: {
        enabled: { type: Boolean, default: false },
        inactivityPeriod: { type: Number, default: 86400000 } // 24 hours
    },
    transcripts: {
        enabled: { type: Boolean, default: true },
        format: { type: String, enum: ['html', 'txt'], default: 'html' },
        destination: { type: String, default: null }
    },
    blacklistedUsers: { type: [String], default: [] },
    blacklistedRoles: { type: [String], default: [] },
    levelingEnabled: { type: Boolean, default: false },
    levelUpChannelId: { type: String, default: null },
    roleRewards: [{
        level: { type: Number, required: true },
        roleId: { type: String, required: true },
    }],
    messageLogChannelId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
