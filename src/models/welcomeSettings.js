const mongoose = require('mongoose');

const welcomeSettingsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  welcomeChannelId: {
    type: String,
    default: null,
  },
  welcomeMessage: {
    type: String,
    default: 'Welcome to the server, {{user}}!',
  },
  welcomeBackgroundImage: {
    type: String,
    default: 'https://i.imgur.com/79SgM2f.jpg',
  },
  welcomeRole: {
    type: String,
    default: null,
  },
  goodbyeChannelId: {
    type: String,
    default: null,
  },
  goodbyeMessage: {
    type: String,
    default: 'Goodbye, {{user}}!',
  },
});

module.exports = mongoose.model('WelcomeSettings', welcomeSettingsSchema);
