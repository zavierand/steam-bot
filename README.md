# SAMMY
Sammy is a simple discord bot that notifies you when games go on sale! This read me is the documentation of the bot along with how to use it.

## Wishlist
Your wish list works very simply. Your wishlist contains any game you want to add to your library. These games in your wishlist

## Commands
`$addGame -[Game Title]` - This command adds a game to your wishlist. 

`$list` - This command prints all of the games in your wishlist in a message.

`$sale -[Game Title]` - This command will tell a user in a server what the current price is and how much it is on sale for!

`$pc -[Game Title]` - Sammy will provide the current retail price of a game that is passed in as an argument.

`$sort -[price] -[name]` - *still in development* This command takes an arbitrary numbe of arguments and will sort the list.

`$help` - This command prints out the list of commands that are currently available.

## API Usage
Sammy was built in NodeJS with the discord.js library. Originally, I wanted to use the Steam API to fetch prices directly from the Steam Store. But in my opinion, the Steam documentation was not easy for me to understand. So I used a free API to fetch all the relevant data needed for the bot to work properly for now. 

# Next Steps
Few plans for the future. Firstly, I wanted to deploy something that works. The commands implemented so far work! Give them a test!

However, as of now - the bot only finds games that are on sale if you play on PC. I want to integrate sales from other stores too such as the PSN store and the Xbox Market next. I also want to get the sort function to work!

# Demo
No demo yet - lol; since the bot is still in developement. Demo section will be updated when the bot is deployed and released.