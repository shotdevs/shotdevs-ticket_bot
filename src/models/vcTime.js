const mongoose = require('mongoose');

const vcTimeSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  timeInVC: {
    type: Number,
    default: 0,
  },
  joinTime: {
    type: Number,
    default: null,
  }
});

module.exports = mongoose.model('VcTime', vcTimeSchema);
