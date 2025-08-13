# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord bot that scrapes and tracks VLR.gg (VALORANT esports site) data for match predictions and event management. The bot allows users to predict match outcomes, track statistics, and automatically check for match updates.

## Core Architecture

### Main Entry Point
- `index.js` - Main bot file that initializes the Discord client, loads events/commands, and connects to MongoDB

### Key Components
- **Events System**: Located in `events/` directory, handles Discord events and VLR checking
  - `events/client/` - Bot initialization and presence management
  - `events/handlers/` - Command and interaction handlers
  - `events/vlrChecker/` - Automated VLR.gg checking and bracket rendering
- **Commands**: Two types of command systems
  - `commands/` - Traditional prefix-based commands
  - `slashCommands/` - Modern Discord slash commands organized by permission level
- **Database Models**: MongoDB schemas in `models/` directory
  - `Event.js` - Tournament/event data
  - `Prediction.js` - User match predictions
  - `guildSchema.js` - Server-specific settings
- **Utilities**: Helper functions in `utils/` directory
  - `config.json` - Bot configuration (colors, emojis, settings)
  - `pagination.js` - Message pagination utilities
  - `autoPoints.js` - Point calculation system

### Key Features
- **Match Prediction System**: Users can predict match outcomes with scores and top fraggers
- **Event Management**: Admins can add VLR events and track matches automatically
- **Bracket Visualization**: Generates bracket graphics using Canvas API
- **Automated Checking**: Periodically checks VLR.gg for match updates and results
- **Statistics Tracking**: Tracks user prediction accuracy and points

## Development Environment

### Required Environment Variables
- `DISCORD_TOKEN` - Discord bot token
- `MONGODB_URI` - MongoDB connection string  
- `ERROR_LOG_CHANNEL_ID` - Discord channel for error logging
- `VLR_SCRAPPER_API` - API endpoint for VLR.gg scraping service

### Dependencies
- `discord.js` (v14) - Discord bot framework
- `mongoose` - MongoDB ODM
- `axios` - HTTP requests for VLR API
- `canvas` - Image generation for brackets
- `moment-timezone` - Date/time handling
- `dotenv` - Environment variable management

## Key File Locations

### Command Files
- Admin commands: `slashCommands/adminCommands/`
- User commands: `slashCommands/userCommands/`
- VLR-specific commands: `slashCommands/vlrCommands/`
- Owner-only commands: `slashCommands/ownerOnlyCommands/`

### Important Models
- **Event Schema**: `eventSchema` in `models/Event.js` - stores tournament data, matches, and bracket information
- **Prediction Schema**: `predictionSchema` in `models/Prediction.js` - stores user predictions with scoring data
- **Guild Schema**: `guildSchema` in `models/guildSchema.js` - server-specific bot settings

### Core Event Handlers
- `events/vlrChecker/checkVlrMatches.js` - Main VLR checking logic with bracket rendering
- `events/handlers/slashCommandListener.js` - Handles slash command interactions
- `events/handlers/autocomplete.js` - Provides autocomplete for slash commands

## Bot Structure Notes

- The bot uses a modular event/command loading system that automatically discovers and loads files
- Slash commands support autocomplete for events, matches, and players
- The prediction system includes week-based organization of matches
- Bracket graphics are generated server-side using HTML5 Canvas
- All database operations use Mongoose with proper error handling
- The bot includes comprehensive permission checking for admin/owner commands