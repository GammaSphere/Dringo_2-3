#!/bin/bash

log "Starting bot with PM2..."


pm2 stop bot 2>/dev/null || true
pm2 delete bot 2>/dev/null || true
# Stop existing PM2 process if running
pm2 stop dringo-lite 2>/dev/null || true
pm2 delete dringo-lite 2>/dev/null || true

# Start bot
pm2 start bot.js --name "bot" --watch
pm2 start index.js --name "dringo-lite" --watch

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true

success "Bot started with PM2"

# Show status
pm2 status