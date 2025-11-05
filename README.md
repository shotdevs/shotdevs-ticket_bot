# shotdevs-ticket_bot

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

shotdevs-ticket_bot is a powerful, multi-server ticket bot for Discord, designed for ultimate customization and scalability.

## Features

- **Advanced Ticket System**: Create unlimited ticket categories with custom modals, staff roles, and logging channels.
- **Customizable Panels**: Design ticket creation panels with custom embeds and buttons.
- **Transcript Generation**: Automatically generate HTML or text transcripts for every ticket.
- **Rate Limiting**: Prevent spam with configurable per-user cooldowns.
- **Blacklisting**: Block specific users or roles from creating tickets.
- **DM Notifications**: Notify users and staff via DM for ticket events.
- **Auto-Close**: Automatically close inactive tickets after a configurable period.
- **Staff Actions Logging**: Keep a detailed audit trail of all staff activity.
- **And much more...**

## Prerequisites

- Node.js v18 or higher
- MongoDB (local or Atlas)
- A Discord Bot Token

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shotdevs/shotdevs-ticket_bot.git
   cd shotdevs-ticket_bot
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your environment:**
   - Copy `.env.example` to `.env`
   - Fill in the required variables (`DISCORD_TOKEN`, `MONGODB_URI`, etc.)
4. **Deploy slash commands:**
   ```bash
   npm run deploy
   ```
5. **Start the bot:**
   ```bash
   npm start
   ```

## Configuration

- Use the `/setup` command to configure the bot for your server.
- Use the `/category` command to create and manage ticket categories.
- Use the `/panel` command to create ticket panels.

## Usage

Once configured, users can create tickets by clicking the buttons on the panels you've created. Staff can manage tickets using the `/ticket` and `/tickets` commands.

## Folder Structure

- `src/commands`: Slash command definitions
- `src/events`: Discord event handlers
- `src/models`: Mongoose schema definitions
- `src/utils`: Utility functions and helpers
- `src/more`: Additional utilities or future features
- `docs`: Project documentation
- `index.js`: Main bot entry point

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please join our Discord server (link here) or open an issue on GitHub.
