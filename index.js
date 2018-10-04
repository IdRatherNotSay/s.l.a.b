/* Main */
const Discord = require('discord.js');
const bot = new Discord.Client({ fetchAllMembers: true });

/* Config */
const botconfig = require('./botconfig.json');

/* Extra */
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment');

let purple = botconfig.purple;
/* Log */
const log = (msg) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${msg}`);
};

/* Activity */
let setActivity = () => {
    bot.user.setActivity(`${botconfig.prefix}help - ${bot.guilds.size} servers!`);
    bot.user.setStatus("Online")
};

setInterval(() => {
	setActivity();
}, 30000);

/* Bot Ready */
bot.on('ready', () => {
    console.log(chalk.green(`${bot.user.username} is ready!\n` + chalk.white('+++')));
    console.log(chalk.cyan(`Total servers: ${bot.guilds.size}\nTotal members: ${bot.users.size - 2}\n` + chalk.white('+++')));

    try {
        bot.generateInvite(['ADMINISTRATOR']).then(link => {
            console.log(chalk.magenta(`Invite me: ${link}`))
        });
    }
    catch(error) {
        console.error(error);
    }

    setActivity();
});

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
fs.readdir('./commands/', (err, files) => {
    if (err) console.error(err);
    log(`Loading a total of ${files.length} commands.`);
    files.forEach(f => {
        let props = require(`./commands/${f}`);
        log(`Loading Command: ${props.help.name}`);
        bot.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name);
        });
    });
});

/* On message */
bot.on('message', async msg => {

    if (!msg.content.startsWith(botconfig.prefix)) return;
    if (msg.channel.type !== 'text') return msg.reply('Please use this command in a server.');
    let command = msg.content.split(' ')[0].slice(botconfig.prefix.length);
    let params = msg.content.split(' ').slice(1);
    let perms = bot.elevation(msg);
    let cmd;
    if (bot.commands.has(command)) {
        cmd = bot.commands.get(command);
    } else if (bot.aliases.has(command)) {
        cmd = bot.commands.get(bot.aliases.get(command));
    }

    if (cmd) {
        if (perms < cmd.conf.permLevel) return;
        cmd.run(bot, msg, params, perms);
    }
});

/* Error & Warn */
bot.on('error', console.error);
bot.on('warn', console.warn);

/* Reload */
bot.reload = function(command) {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./cmds/${command}`)];
            let cmd = require(`./cmds/${command}`);
            bot.commands.delete(command);
            bot.aliases.forEach((cmd, alias) => {
                if (cmd === command) bot.alias.delete(alias);
            });

            bot.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                bot.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

/* Elevation */
bot.elevation = function(msg) {
    let permlvl = 0;
    let trial_role = msg.guild.roles.find('name', 'Trial Staff') || msg.guild.roles.find('name', '{PM} Partner Manager');
    if(trial_role && msg.member.roles.has(trial_role.id)) permlvl = 1;
    let mod_role = msg.guild.roles.find('name', '{M} Moderators');
    if(mod_role && msg.member.roles.has(mod_role.id)) permlvl = 2;
    let admin_role = msg.guild.roles.find('name', '{A} Administrators');
    if(admin_role && msg.member.roles.has(admin_role.id)) permlvl = 3;
    let hs_role = msg.guild.roles.find('name', '{HS} Head Staff');
    if(hs_role && msg.member.roles.has(hs_role.id)) permlvl = 4;
    let ma_role = msg.guild.roles.find('name', 'Manager') || msg.guild.roles.find('name', 'Co-Owner') || msg.guild.roles.find('name', 'Owner');
    if(ma_role && msg.member.roles.has(ma_role.id) || msg.member.id == botconfig.owner) permlvl = 5;
    return permlvl;
};


/* Login */
bot.login(botconfig.token);
