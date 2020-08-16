## Prerequisites
1. You will need to create a discord bot (do this at https://discord.com/developers/applications)
2. Give the bot the "bot" role and "Manage Roles" permission, copy the oauth url it gives, and authorize it for your discord server
3. Make sure the role you give the bot in your discord is above all your users and make sure it also has "Manage Roles" permission checked
 
## Setup
1. Clone this repository
2. Copy config.json.sample and rename config.json
3. Enter your discord bot token (you get this from the discord bot developer section)

## Usage
### Manually with nodejs
1. Install nodejs on your OS
2. Run the following command (in git directory) to install discord.js
```bash
npm install discord.js
``` 
3. Run the following command (in git directory) to run the bot
```bash
node bot.js
``` 
### Docker
1. Install docker on your OS
2. Run following command to build the docker image in git directory
```bash
docker build -t discord-bot .
```
3. Run following command to run the newly created image
```bash
docker run -d discord-bot
```
4. To see logs
```bash
docker logs <container-name>
```

## Original Credits
https://github.com/pnill

https://github.com/num0005

https://github.com/bigtweekx

https://github.com/StelluR
