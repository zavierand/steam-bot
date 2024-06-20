import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import UserWishlist from './models/user_wishlist.mjs';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cmdPath = path.join(__dirname, 'utils', 'commands.json');
// commented out, but will keep just incase if needed
//const commands = JSON.parse(fs.readFileSync(cmdPath, 'utf-8'));
const call = '$';

client.on('ready', () => {
    console.log('Bot is ready!');
});

// Command Handlers (adding to wishlist, checking price, printing current list, and help command)
// all are callback functions assigned to variables
const handleAddGame = async (msg, args) => {
    const gameTitle = args.join(' ');
    if (!gameTitle) {
        return msg.reply('Please provide a game title.');
    }

    await UserWishlist.updateOne(
        { discordID: msg.author.id },
        { $addToSet: { games: gameTitle } },
        { upsert: true }
    );
    msg.reply(`Added "${gameTitle}" to your wishlist!`);
};

// print list
const handlePrintWishlist = async (msg) => {
    try {
        const wishlist = await UserWishlist.findOne({ discordID: msg.author.id });

        if (!wishlist || wishlist.games.length === 0) {
            return msg.reply('Your wishlist is empty.');
        }

        // Initialize the array to hold the game details
        const gameDetailsArray = [];

        // Use Promise.all to fetch game details concurrently
        await Promise.all(wishlist.games.map(async (gameTitle) => {
            const apiUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameTitle)}`;
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (data.length > 0) {
                const gameData = data[0];
                const gameDetailsURL = `https://www.cheapshark.com/api/1.0/games?id=${encodeURIComponent(gameData.gameID)}`;

                const gameDetailsRes = await fetch(gameDetailsURL);
                const gameDetails = await gameDetailsRes.json();

                // Add the game details to the array
                gameDetailsArray.push({
                    title: gameTitle,
                    retailPrice: gameDetails.deals[0].retailPrice,
                    salePrice: gameDetails.deals[0].price,
                    savings: parseFloat(gameDetails.deals[0].savings).toFixed(2),
                    storeLink: `https://www.cheapshark.com/redirect?dealID=${gameDetails.deals[0].dealID}`,
                    thumbnailUrl: gameDetails.info.thumb
                });
            }
        }));

        // Create an embed message
        const embedMessage = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Your Wishlist')
            .setAuthor({ name: 'SAMMY', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
            .setDescription('Here are the games in your wishlist:')
            .setTimestamp()
            .setFooter({ text: 'Sammy', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        // Add fields for each game
        gameDetailsArray.forEach(game => {
            const gameInfo = `
                **Retail Price:** $${game.retailPrice}
                **Sale Price:** $${game.salePrice}
                **Discount:** ${game.savings}%
                [Link to Store](${game.storeLink})
                `;
            embedMessage.addFields(
                { name: game.title, value: gameInfo, inline: false }
            );
        });

        // Reply with the embed message
        msg.reply({ embeds: [embedMessage] });

    } catch (err) {
        msg.reply('Error fetching your wishlist.');
        console.error('List retrieval failed:', err);
    }
};

// handle best current sale
const handleBestSale = async (msg, args) => {
    const gameTitle = args.join(' ');
    const apiURL = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameTitle)}`;

    try {
        const res = await fetch(apiURL);
        const data = await res.json();

        if (data.length > 0) {
            const gameData = data[0];
            const gameDetailsURL = `https://www.cheapshark.com/api/1.0/games?id=${encodeURIComponent(gameData.gameID)}`;

            const gameDetailsRes = await fetch(gameDetailsURL);
            const gameDetails = await gameDetailsRes.json();

            let salePrice = 'N/A';
            let storeLink = '#';
            let discount = 'N/A';

            if (gameDetails.deals && gameDetails.deals.length > 0) {
                const bestDeal = gameDetails.deals.reduce((best, deal) => {
                    return parseFloat(deal.price) < parseFloat(best.price) ? deal : best;
                }, gameDetails.deals[0]);

                salePrice = bestDeal.price;
                storeLink = `https://www.cheapshark.com/redirect?dealID=${bestDeal.dealID}`;
                discount = parseFloat(bestDeal.savings).toFixed(2);
            }

            const thumbnailUrl = gameDetails.info.thumb;

            const embedMessage = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(gameTitle)
                .setURL(storeLink)
                .setAuthor({ name: 'SAMMY', iconURL: 'https://i.imgur.com/AfFp7pu.png'})
                .setDescription('This is the best deal out right now! Cop it now! Or you can wait until I send you a notification when another deal comes our way :P Make sure it\'s in ya wishlist tho fool :P')
                .setThumbnail(thumbnailUrl)
                .addFields(
                    { name: 'Game Title:', value: gameTitle, inline: true },
                    { name: 'Sale Price:', value: `$${salePrice}`, inline: true },
                    { name: 'Discount:', value: `${discount}%`, inline: true }
                )
                .setImage(thumbnailUrl)
                .setTimestamp()
                .setFooter({ text: 'Sammy', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

            msg.reply({ embeds: [embedMessage] });
        } else {
            msg.reply(`Could not fetch data for ${gameTitle}`);
        }
    } catch(err) {
        console.error(`Error retrieving best current sale for ${gameTitle}:`, err);
        msg.reply(`Could not retrieve best current sale for ${gameTitle}`);
    }
};

// handle price check
const handlePriceCheck = async (msg, args) => {
    const gameTitle = args.join(' ');

    // Fetch game data from CheapShark API
    const apiUrl = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameTitle)}`;

    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.length > 0) {
            const gameData = data[0];
            const gameDetailsUrl = `https://www.cheapshark.com/api/1.0/games?id=${gameData.gameID}`;

            const gameDetailsRes = await fetch(gameDetailsUrl);
            const gameDetails = await gameDetailsRes.json();

            let retailPrice = 'N/A';
            if (gameDetails.deals && gameDetails.deals.length > 0) {
                retailPrice = gameDetails.deals[0].retailPrice > 0 ? gameDetails.deals[0].retailPrice : 'Free';
            }

            const storeLink = `https://www.cheapshark.com/redirect?dealID=${gameDetails.deals[0].dealID}`;
            const thumbnailUrl = gameDetails.info.thumb;  // obj.thumb == thumbnail img for game
            const imageUrl = thumbnailUrl; // using thumbnail as the main image

            // Create an embed message
            const embedMessage = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(gameTitle)
                .setURL(storeLink)
                .setAuthor({ name: 'SAMMY', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
                .setDescription('Cop it now! Or wait til I send you a notification when it goes on sale ;) Make sure it\'s in ya wishlist tho fool :P')
                .setThumbnail(thumbnailUrl)
                .addFields(
                    { name: 'Game Title:', value: gameTitle, inline: true },
                    { name: 'Retail Price:', value: `$${retailPrice}`, inline: true }
                )
                .setImage(imageUrl)
                .setTimestamp()
                .setFooter({ text: 'Sammy', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

            msg.reply({ embeds: [embedMessage] });
        } else {
            msg.reply(`No data found for ${gameTitle}`);
        }
    } catch (err) {
        console.error('Error checking price:', err);
        msg.reply('An error occurred while checking prices.');
    }
};

// help command
const handleHelp = (msg) => {
    msg.reply('Available commands: \`$addGame [game title]\`, \`$list\`, \`$sale [game title]\`, \`$pc [game title]\`, \`$help\`');
};

// commands
const commandMap = {
    addGame: handleAddGame,
    list: handlePrintWishlist,
    sale: handleBestSale,
    pc: handlePriceCheck,
    help: handleHelp
};

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith(call)) {
        return;
    }

    // trim whitespace (if needed)
    const [cmdName, ...args] = msg.content
        .slice(call.length)
        .trim()
        .split(/\s+/);

    const commandHandler = commandMap[cmdName];

    // handle commands (similar to event handler)
    if (commandHandler) {
        try {
            await commandHandler(msg, args);
        } catch (err) {
            console.error(`Error executing command ${cmdName}:`, err);
            msg.reply(`There was an error executing the command ${cmdName}.`);
        }
    } else {
        msg.reply(`Unknown command \`${msg.content}\`. Use \`$help\` to see available commands.`);
    }
});

// check for game sales
const checkSales = async () => {
    try {
        const wishlists = await UserWishlist.find();
        for (const wishlist of wishlists) {
            for (const game of wishlist.games) {
                const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(game)}&exact=1`);
                const deals = await res.json();
                if (deals.length > 0) {
                    // notify users via dm
                    const bestDeal = deals[0];
                    client.users.fetch(wishlist.discordID).then(user => {
                        user.send(`"${bestDeal.title}" is on sale for $${bestDeal.salePrice} at ${bestDeal.storeID}!`);
                    });

                    // + notify users via embedded msg
                    const exampleEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(gameTitle)
                        .setURL(storeLink)
                        .setAuthor({ name: 'SAMMY', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
                        .setDescription('Cop it now! Or wait til I send you a notification when it goes on sale ;) Make sure it\'s in ya wishlist tho fool :P')
                        .setThumbnail(thumbnailUrl)
                        .addFields(
                            { name: 'Game Title:', value: gameTitle, inline: true },
                            { name: 'Retail Price:', value: `$${retailPrice}`, inline: true }
                        )
                        .setImage(imageUrl)
                        .setTimestamp()
                        .setFooter({ text: 'Sammy', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

                    msg.reply({ embeds: [exampleEmbed] });
                }
            }
        }
    } catch (err) {
        console.error('Error checking sales:', err);
    }
};

// check for sales every hour
setInterval(checkSales, 3600000);

client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log(`${client.user.username} successfully logged in!`);
    })
    .catch((err) => {
        console.error(`${client.user.username} could not log in ):`, err);
    });
