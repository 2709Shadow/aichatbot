# Discord AI Chatbot

A Discord bot that provides AI chat functionality, automatic moderation for inappropriate language and links, and supports global announcements by the bot owner. It also allows for configurable commands and dynamic channel settings.

### Features

- AI chat responses using Cleverbot.
- Automatic moderation for inappropriate language.
- Link spam detection and moderation.
- GIF detection to exclude from moderation.
- Configurable commands for setting up channels and adding bad words.
- Global announcements by the bot owner.
- Help command to list and describe available commands.
- Supports multiple servers with individual configurations.
- Stores configurations and bad words in MongoDB.

### Prerequisites

- Node.js (v14 or higher)
- MongoDB instance
- Discord bot token

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/2709Shadow/aichatbot.git
   cd discord-ai-chatbot
2. Intall dependencies:
   ```
   npm install
3. Edit .env.example to .env. fill it with your data:
   ```
   BOT_TOKEN=your_bot_token_here
   MONGODB_URI=your_mongodb_uri_here
   BOT_OWNER=your_discord_user_id_here
4. Start the bot:
   ```
   node .
   ```
### Usage 

   Commands
   !setchannel <channelid>: Sets the channel for the bot to respond in.
   !addbadword <word>: Adds a word to the list of banned words.
   !setup: Creates an AI Chat channel for the bot to use.
   !addchannelexception <channelid>: Adds a channel to the list of link exception channels.
   !help [command]: Shows the list of commands or details of a specific command.
   !sendglobalannounce <message>: Sends a global announcement to all servers (only for the bot owner).

### Contributing

Feel free to fork this repository and submit pull requests. Contributions are welcome!

### Preview bot
https://discord.gg/suAEDynUgp
