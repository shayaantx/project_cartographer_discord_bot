const Discord = require('discord.js');
const { Client, MessageEmbed } = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const bot = new Discord.Client();
const PLAYING_HALO2_ROLE = 'Playing Halo 2';
const HALO2_ACTIVITY_NAME = 'Halo 2: Project Cartographer';
const xpFile = 'xp.json';

// Connection to Discord API
bot.login(config.discord_token);

function removeRole(guildMember, role) {
	// If the role name starts with a controller, remove it
	guildMember.roles.remove(role).then((guildMember) => {
		console.log(`Successfully removed stale roles for member ${guildMember.user.username}`)
	}).catch((error) => {
		console.log(`Error caught trying to remove stale roles for user ${guildMember.user.username}, error=${error}`);
	});
}

function checkAndRemoveHalo2Role(guildMember) {
	guildMember.roles.cache.filter(function(role) {
		return role.name === PLAYING_HALO2_ROLE;
	}).forEach(role => {
		removeRole(guildMember, role);
	});
}

function removeStaleRoles() {
	// For each guild, member, and role
	bot.guilds.cache.forEach(guild => {
		guild.members.cache.forEach(member => {
			checkAndRemoveHalo2Role(member);
		});
	});
}

function getPlayingHalo2Role(roles) {
	let roleId;
	roles.cache.filter(function(role) {
		return role.name === PLAYING_HALO2_ROLE;
	}).forEach(role => {
		roleId = role.id;
	});
	if (!roleId) {
		throw new Error(`Could not find role ${PLAYING_HALO2_ROLE}`)
	}
	return roleId;
}
function checkIfFileExists(){
	try {
		if (!fs.existsSync(xpFile)) {
			let xpData = {"xpData" : []};
			let data = JSON.stringify(xpData)
			fs.writeFileSync('xp.json', data);
		}
	} catch(err) {
		console.error(err)
	}
}
// Bot connection
bot.on('ready', function () {
	console.log('The bot is online !');
	// only remove stale roles on startup
	checkIfFileExists();
	removeStaleRoles();
});

// Bot connection
bot.on('disconnect', function () {
	console.log('Disconnected...');
});


// Feature : The bot gives members a role depending the game they are currently playing
bot.on('presenceUpdate', (oldPresence, newPresence) => {
	const newMember = newPresence.member;
	const guild = newMember.guild;
	const activities = newMember.user.presence.activities;

	let isPlayingHalo2 = false;
	if (activities) {
		activities.forEach(activity => {
			if (activity.name === HALO2_ACTIVITY_NAME) {
				isPlayingHalo2 = true;
				guild.roles.fetch(getPlayingHalo2Role(guild.roles)).then((playingHalo2Role) => {
					newMember.roles.add(playingHalo2Role).then(function() {
						console.log(`Role : Halo 2 given to ${newMember.user.username}`);
					}).catch((error) => {
						console.log(`Error trying to add halo 2 role for user ${newMember.user.username}, error=${error}`)
					});
				}).catch((error) => {
					console.log(`Could not find playing halo 2 role error=${error}`)
				})
			}
		});
	}

	if (!isPlayingHalo2) {
		// remove the role if not playing anymore
		checkAndRemoveHalo2Role(newMember);
	}
});


bot.on('message', message => {
	if (!message.guild) return;
	//return if message is a bot
	if(message.author.bot) return;	

	if(message.system) return;

	if(message.toString().charAt(0) === '!') return;
	//check to see if the data file exists
	  

	if(message.author.id != bot.user.id) {
		checkIfFileExists();
		fs.readFile(xpFile, (err, data) => {
			if (err) throw err;
			let xpDataRead = JSON.parse(data);
			//console.log(xpDataRead);
			let found = false; // flag to say if data exists in the JSON or not
			let levelInfo;
			for(var index in xpDataRead.xpData){
				//we found the user data in the JSON file
				if(xpDataRead.xpData[index].id === message.author.id){
					found = true;
					levelInfo = xpDataRead.xpData[index].level;
					xpDataRead.xpData[index].numMessages = xpDataRead.xpData[index].numMessages + 1; // increment messages
					if(xpDataRead.xpData[index].numMessages >= xpDataRead.xpData[index].messagesRequiredToNextLevel){ //if we've hit a new level
						levelInfo = levelInfo + 1;
						xpDataRead.xpData[index].level = xpDataRead.xpData[index].level + 1; //increment level data
						if(levelInfo < 150){
							xpDataRead.xpData[index].messagesRequiredToNextLevel = xpDataRead.xpData[index].messagesRequiredToNextLevel * (2 * Math.exp(-1 * ((levelInfo-1.7)/4)) + 1.02); // determines messages to the next level
						}
						else{
							xpDataRead.xpData[index].messagesRequiredToNextLevel = xpDataRead.xpData[index].messagesRequiredToNextLevel + 100; //past rank 150, flat 100 message increase to next level
						}
						const embed = new MessageEmbed() //send the message to the user letting them know they've ranked up
							// Set the title of the field
							.setTitle('Congratulations ' + message.author.username + ', You have ranked up!')
							// Set the color of the embed
							.setColor(0xff0000)
							// Set the main content of the embed
							.setDescription("You've reached rank " + levelInfo + "!");
							// Send the embed to the same channel as the message
						message.channel.send(embed);
					}
				}
			}
			if(!found){ // if we can't find a user's info in the JSON file
				levelInfo = 1;
				let xpInformation = { 
					id: message.author.id,
					username: message.author.username,
					level: 1,
					numMessages: 1,
					messagesRequiredToNextLevel: 2
				};
				xpDataRead.xpData.push(xpInformation);
			}
			
			if(xpDataRead){
				let data = JSON.stringify(xpDataRead);
				fs.writeFile(xpFile, data, (err) => { //write data to file asynchronously
					if (err) throw err;
				});
			}

		});
	}
  });
