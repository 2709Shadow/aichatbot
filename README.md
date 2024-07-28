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
- MongoDB instance (local or cloud)
- Discord bot token

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/discord-ai-chatbot.git
   cd discord-ai-chatbot
