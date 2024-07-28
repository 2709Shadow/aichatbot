require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');
const keepAlive = require('./server.js');
const cleverbot = require('cleverbot-free');
const Filter = require('bad-words');
const { Guild, BadWord } = require('./models');

keepAlive();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const filter = new Filter();
const BOT_OWNER = process.env.BOT_OWNER;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB')).catch(console.error);

async function loadCustomBadWords() {
  const badWords = await BadWord.find({});
  badWords.forEach(bw => filter.addWords(bw.word));
}

async function errorEmbed(text, message) {
  const newembed = new EmbedBuilder()
    .setColor('#FF7676')
    .setDescription(`**❌ | ${text} **`);
  return message.channel.send({ embeds: [newembed] });
}

async function getChatBotResponse(query) {
  try {
    const response = await cleverbot(query);
    return response;
  } catch (error) {
    console.error('Error fetching ChatBot response:', error);
    throw error;
  }
}

function isGifUrl(url) {
  return url.match(/\.(gif)$/i) || url.includes('giphy.com') || url.includes('tenor.com');
}

const commands = {
  setchannel: {
    description: "Sets the channel for the bot to respond in.",
    usage: "!setchannel <channelid>"
  },
  addbadword: {
    description: "Adds a word to the list of banned words.",
    usage: "!addbadword <word>"
  },
  setup: {
    description: "Creates an AI Chat channel for the bot to use.",
    usage: "!setup"
  },
  addchannelexception: {
    description: "Adds a channel to the list of link exception channels.",
    usage: "!addchannelexception <channelid>"
  },
  help: {
    description: "Shows the list of commands or details of a specific command.",
    usage: "!help [command]"
  },
  sendglobalannounce: {
    description: "Sends a global announcement to all servers.",
    usage: "!sendglobalannounce <message>"
  }
};

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Handle DMs
  if (!message.guild) {
    const query = message.content.trim();
    if (query.length === 0) return; // Ignore empty messages

    try {
      const botResponse = await getChatBotResponse(query);
      if (botResponse.trim().length === 0) {
        throw new Error('Received empty response from API');
      }
      message.reply(botResponse);
    } catch (err) {
      console.error('Error handling message:', err);
      message.author.send('Bot error, please try again!');
    }
    return;
  }

  // Handle messages in guilds
  const guildConfig = await Guild.findOne({ guildId: message.guild.id });

  // Check if the message is in the designated channel or is a command
  if (guildConfig && message.channel.id !== guildConfig.channelId && !message.content.startsWith('!')) return;

  const messageContentLower = message.content.toLowerCase();
  const isProfane = filter.isProfane(message.content);

  if (isProfane) {
    try {
      await message.delete();
      await message.member.timeout(600000, 'Inappropriate language');
      message.channel.send(`${message.author} has been timed out for using inappropriate language.`);
    } catch (err) {
      console.error('Error applying timeout:', err);
    }
    return;
  }

  if (message.content.includes('http') || message.content.includes('www')) {
    if (isGifUrl(message.content)) {
      // Do nothing for GIFs
    } else if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      // Allow links for admins
    } else if (guildConfig && guildConfig.linkExceptionChannels.includes(message.channel.id)) {
      // Allow links in exception channels
    } else {
      try {
        await message.delete();
        await message.member.ban({ reason: 'Link spam' });
        message.channel.send(`${message.author} has been banned for link spamming.`);
      } catch (err) {
        console.error('Error applying ban:', err);
      }
      return;
    }
  }

  const prefix = '!';

  const [cmd, ...args] = message.content.slice(prefix.length).trim().split(' ');
  const command = commands[cmd];

  if (cmd === 'setchannel' && args.length === 1) {
    const newChannelId = args[0].replace(/[<@#>]/g, '');
    const channel = message.guild.channels.cache.get(newChannelId);

    if (channel) {
      await Guild.findOneAndUpdate(
        { guildId: message.guild.id },
        { guildId: message.guild.id, channelId: newChannelId },
        { upsert: true }
      );
      message.channel.send(`Bot channel set to <#${newChannelId}>`);
    } else {
      message.channel.send(`Invalid channel ID: ${newChannelId}`);
    }
    return;
  }

  if (cmd === 'addbadword' && args.length === 1) {
    const newBadWord = args[0].toLowerCase();
    await BadWord.create({ word: newBadWord });
    filter.addWords(newBadWord);
    message.channel.send(`Added new bad word: ${newBadWord}`);
    return;
  }

  if (cmd === 'setup') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.channel.send('You need Administrator permissions to use this command.');
      return;
    }
    try {
      const aiChatChannel = await message.guild.channels.create({
        name: 'AI Chat',
        type: 0
      });
      await Guild.findOneAndUpdate(
        { guildId: message.guild.id },
        { guildId: message.guild.id, channelId: aiChatChannel.id },
        { upsert: true }
      );
      message.channel.send(`AI Chat channel created: <#${aiChatChannel.id}>`);
    } catch (err) {
      console.error('Error creating AI Chat channel:', err);
      message.channel.send('Failed to create AI Chat channel.');
    }
    return;
  }

  if (cmd === 'addchannelexception' && args.length === 1) {
    const exceptionChannelId = args[0].replace(/[<@#>]/g, '');
    const channel = message.guild.channels.cache.get(exceptionChannelId);

    if (channel) {
      await Guild.findOneAndUpdate(
        { guildId: message.guild.id },
        { $addToSet: { linkExceptionChannels: exceptionChannelId } },
        { upsert: true }
      );
      message.channel.send(`Channel <#${exceptionChannelId}> is now a link exception channel.`);
    } else {
      message.channel.send(`Invalid channel ID: ${exceptionChannelId}`);
    }
    return;
  }

  if (cmd === 'sendglobalannounce' && args.length > 0) {
    if (message.author.id !== BOT_OWNER) {
      message.channel.send('You do not have permission to use this command.');
      return;
    }

    const announcement = args.join(' ');
    const guilds = await Guild.find({});

    guilds.forEach(async (guildConfig) => {
      const guild = client.guilds.cache.get(guildConfig.guildId);
      if (guild) {
        const channel = guild.channels.cache.get(guildConfig.channelId);
        if (channel) {
          channel.send(`📢 **Global Announcement:** ${announcement}`);
        }
      }
    });

    message.channel.send('Global announcement sent.');
    return;
  }

  if (cmd === 'help') {
    if (args.length === 0) {
      const helpMessage = Object.keys(commands)
        .map(cmd => `\`${cmd}\`: ${commands[cmd].description}`)
        .join('\n');
      const helpEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Help - List of Commands')
        .setDescription(helpMessage)
        .setFooter({ text: 'Use !help <command> for more details on a specific command.' });
      message.channel.send({ embeds: [helpEmbed] });
    } else if (args.length === 1) {
      const helpCmd = args[0];
      if (commands[helpCmd]) {
        const helpCmdEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`Help - ${helpCmd} Command`)
          .setDescription(commands[helpCmd].description)
          .addFields({ name: 'Usage', value: commands[helpCmd].usage });
        message.channel.send({ embeds: [helpCmdEmbed] });
      } else {
        const helpMessage = Object.keys(commands)
          .map(cmd => `\`${cmd}\`: ${commands[cmd].description}`)
          .join('\n');
        const helpEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Help - Command Not Found')
          .setDescription(`Command \`${helpCmd}\` not found.\n\nAvailable commands:\n${helpMessage}`)
          .setFooter({ text: 'Use !help <command> for more details on a specific command.' });
        message.channel.send({ embeds: [helpEmbed] });
      }
    }
    return;
  }

  if (guildConfig && message.channel.id === guildConfig.channelId) {
    const query = message.content.trim();
    if (query.length === 0) return;

    try {
      const botResponse = await getChatBotResponse(query);
      if (botResponse.trim().length === 0) {
        throw new Error('Received empty response from API');
      }
      message.reply(botResponse);
    } catch (err) {
      console.error('Error handling message:', err);
      errorEmbed('Bot error, please try again!', message);
    }
  }
});

client.once('ready', async () => {
  console.clear();
  console.log(`${client.user.tag} is online!`);
  await loadCustomBadWords();
});

client.login(process.env.BOT_TOKEN);