const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client();

const PLAYING_HALO2_ROLE = 'Playing Halo 2';
const HALO2_ACTIVITY_NAME = 'Halo 2: Project Cartographer';

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

// Bot connection
bot.on('ready', function () {
	console.log('The bot is online !');
	// only remove stale roles on startup
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
