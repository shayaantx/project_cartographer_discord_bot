const Discord = require('discord.js');
const { Client, MessageEmbed } = require('discord.js');
const config = require('./config.json');
const xp =  require('./xp.js');
const bot = new Discord.Client();
const PLAYING_HALO2_ROLE = 'Playing Halo 2';
const HALO2_ACTIVITY_NAME = 'Halo 2: Project Cartographer';
const xpFile = 'xpData.json';
const xpBot = new xp(xpFile);


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

//Send the message to the user letting them know they've ranked up
function sendMessage(message, levelInfo) {
	const embed = new MessageEmbed() 
	   // Set the title of the field
	   .setTitle('Congratulations ' + message.author.username + ', You have ranked up!')
	   // Set the color of the embed
	   .setColor(0xff0000)
	   // Set the main content of the embed
	   .setDescription("You've reached rank " + levelInfo + "!");
	// Send the embed to the same channel as the message
	message.channel.send(embed);
}

// Bot connection
bot.on('ready', function () {
	console.log('The bot is online !');
	// only remove stale roles on startup
	removeStaleRoles();
	if(config.xp_functionality) {
		xpBot.ready();
	}
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

// Feature : The bot gives members a rank based on their messages
if(config.xp_functionality) {
	bot.on('message', message => {
		xpBot.updateXpData(message, bot.user.id , function(level){
			sendMessage(message, level);
		});
	});
}

