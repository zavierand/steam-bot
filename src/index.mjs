import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// import dotenv vars
dotenv.config();

// instantiate an instance client object
const client = new Client({
    // intents for Sammy to interact with
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ] 
});

// commands will be stored in .json file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// construct paths now
const cmdPath = path.join(__dirname, 'utils', 'commands.json');
const commands = JSON.parse(fs.readFileSync(cmdPath, 'utf-8'));
const call = '$';

client.on('ready', () => {
    console.log('ping!');
});

// commands
client.on('messageCreate', (msg) => {
    // check if msg was from bot (lol)
    if (msg.author.bot || !msg.content.startsWith(call)) {
        return;
    }

    // Extract command and arguments
    // remove prefix then trim and split any whitespace
    // spread operator after we destructure arr
    const [cmdName, ...args] = msg.content
        .slice(call.length)
        .trim()
        .split(/\s+/);

    // check if the command exists in commands.json
    if (commands[cmdName]) {
        // logging cmd to console
        console.log(`Command executed: ${cmdName}`);
        // send the command response to the channel
        msg.channel.send(commands[cmdName]);
    } else {
        // send a message indicating unknown command
        msg.channel.send(`U good fool? \`${msg.content}\` ain't valid my guy. Use \`$help\` to see available commands.`);
    }
});


client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log(`${client.user.username} successfully logged in!`);
    })
    .catch((err) => {
        console.error(`${client.user.username} could not log in ):`, err);
    });
