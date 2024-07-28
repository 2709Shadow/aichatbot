const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  linkExceptionChannels: [String]
});

const badWordSchema = new mongoose.Schema({
  word: String
});

const Guild = mongoose.model('Guild', guildSchema);
const BadWord = mongoose.model('BadWord', badWordSchema);

module.exports = { Guild, BadWord };
