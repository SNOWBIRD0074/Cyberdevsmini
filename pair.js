const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const { Octokit } = require('@octokit/rest');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
const yts = require("yt-search");
const fetch = require("node-fetch"); 
const api = `https://api-dark-shan-yt.koyeb.app`;
const apikey = `edbcfabbca5a9750`;
const { initUserEnvIfMissing } = require('./settingsdb');
const { initEnvsettings, getSetting } = require('./settings');
//=======================================
const autoReact = getSetting('AUTO_REACT')|| 'off';

//=======================================
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    proto,
    prepareWAMessageMedia,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');
//=======================================
const config = {
    AUTO_VIEW_STATUS: 'true',
    AUTO_LIKE_STATUS: 'true',
    AUTO_RECORDING: 'true',
    AUTO_LIKE_EMOJI: ['🧩', '🍉', '💜', '🌸', '🪴', '💊', '💫', '🍂', '🌟', '🎋', '😶‍🌫️', '🫀', '🧿', '👀', '🤖', '🚩', '🥰', '🗿', '💜', '💙', '🌝', '🖤', '💚'],
    PREFIX: '.',
    MAX_RETRIES: 3,
    GROUP_INVITE_LINK: 'https://chat.whatsapp.com/Bp7n9LfdcXo8JAz4Spvuey?mode=ac_t',
    ADMIN_LIST_PATH: './admin.json',
    IMAGE_PATH: 'https://files.catbox.moe/y9ag28.jpg',   // ✅ bot picture
    NEWSLETTER_JID: '120363399707841760@newsletter',
    NEWSLETTER_MESSAGE_ID: '428',
    OTP_EXPIRY: 300000,
    NEWS_JSON_URL: '',
    BOT_NAME: 'ᴄʏʙᴇʀᴅᴇᴠᴀ ᴍɪɴɪ',
    OWNER_NAME: 'sɴᴏᴡʙɪʀᴅ',
    OWNER_NUMBER: '263780145644',
    BOT_VERSION: '5.0.0',
    BOT_FOOTER: '> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sɴᴏᴡʙɪʀᴅ',
    CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb5nSebFy722d2NEeU3C',
    BUTTON_IMAGES: {
        ALIVE: 'https://files.catbox.moe/y9ag28.jpg',
        MENU: 'https://files.catbox.moe/y9ag28.jpg',
        OWNER: 'https://files.catbox.moe/y9ag28.jpg',
        SONG: 'https://files.catbox.moe/y9ag28.jpg',
        VIDEO: 'https://files.catbox.moe/y9ag28.jpg'
    }
};

// ==========================
// (unchanged helper functions … loadAdmins, formatMessage, generateOTP, resize, etc.)
// ==========================

// ==========================
// setupCommandHandlers with updated MENU
// ==========================
function setupCommandHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

        let command = null;
        let args = [];
        let sender = msg.key.remoteJid;

        if (msg.message.conversation || msg.message.extendedTextMessage?.text) {
            const text = (msg.message.conversation || msg.message.extendedTextMessage.text || '').trim();
            if (text.startsWith(config.PREFIX)) {
                const parts = text.slice(config.PREFIX.length).trim().split(/\s+/);
                command = parts[0].toLowerCase();
                args = parts.slice(1);
            }
        }
        else if (msg.message.buttonsResponseMessage) {
            const buttonId = msg.message.buttonsResponseMessage.selectedButtonId;
            if (buttonId && buttonId.startsWith(config.PREFIX)) {
                const parts = buttonId.slice(config.PREFIX.length).trim().split(/\s+/);
                command = parts[0].toLowerCase();
                args = parts.slice(1);
            }
        }

        if (!command) return;

        try {
            switch (command) {   
                // ✅ MENU COMMAND with bot picture
                case 'menu': {
                    const startTime = socketCreationTime.get(number) || Date.now();
                    const uptime = Math.floor((Date.now() - startTime) / 1000);
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);

                    await socket.sendMessage(sender, { react: { text: "💜", key: msg.key } });

                    const title = '🌸 ᴄʏʙᴇʀᴅᴇᴠᴀ ᴍɪɴɪ - ᴍᴇɴᴜ 🌸';
                    const text = 
`❐═══════════════❐
> 『 BOT STATUS 💚 』       
❐═══════════════❐
✪ *Name*: ${config.BOT_NAME}
✪ *Owner*: ${config.OWNER_NAME}
✪ *Version*: ${config.BOT_VERSION}
✪ *Platform*: VPS
✪ *Uptime*: ${hours}h ${minutes}m ${seconds}s
❐═══════════════❐
> Powered by SNOWBIRD        
❐═══════════════❐
Official Channel:
${config.CHANNEL_LINK}`;

                    const sections = [
                        {
                            title: "MAIN COMMANDS",
                            rows: [
                                { title: "Alive", description: "Show bot information", rowId: `${config.PREFIX}alive` },
                                { title: "System Info", description: "Show system details", rowId: `${config.PREFIX}system` },
                                { title: "Ping", description: "Check bot latency", rowId: `${config.PREFIX}ping` }
                            ]
                        },
                        {
                            title: "MEDIA DOWNLOAD",
                            rows: [
                                { title: "Song", description: "Download audio from YouTube", rowId: `${config.PREFIX}song` },
                                { title: "Video", description: "Download video from YouTube", rowId: `${config.PREFIX}video` }
                            ]
                        },
                        {
                            title: "OTHER COMMANDS",
                            rows: [
                                { title: "Owner", description: "Contact bot owner", rowId: `${config.PREFIX}owner` },
                                { title: "Preferences", description: "Change bot settings", rowId: `${config.PREFIX}preferences` },
                                { title: "Channel", description: "Get our channel link", rowId: `${config.PREFIX}channel` }
                            ]
                        }
                    ];

                    await socket.sendMessage(sender, {
                        image: { url: config.IMAGE_PATH },   // ✅ always use bot picture
                        caption: text,
                        footer: config.BOT_FOOTER,
                        title: title,
                        buttonText: "SELECT OPTION",
                        sections: sections
                    });
                    break;
                }

                // (alive, ping, owner, system, song, news … remain unchanged)
            }
        } catch (error) {
            console.error('Command handler error:', error);
            await socket.sendMessage(sender, {
                image: { url: config.IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    'An error occurred while processing your command. Please try again.',
                    `${config.BOT_FOOTER}`
                )
            });
        }
    });
}

// ==========================
// EmpirePair keeps setting profile pic on connect (unchanged)
// ==========================

// (rest of pair.js remains identical … connection.update, routes, etc.)

module.exports = router;