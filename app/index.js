require('dotenv').config()

function onInstallation(bot, installer) {
  if (installer) {
    bot.startPrivateConversation({
      user: installer
    }, function(err, convo) {
      if (err) {
        console.log(err);
      } else {
        convo.say('Hi, my name is atls! You can private message me or /invite me to a channel. To see what I can do, use the command `help`');
      }
    });
  }
}

/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGODB_URI) {
  var BotkitStorage = require('botkit-storage-mongo');
  config = {
    storage: BotkitStorage({
      mongoUri: process.env.MONGODB_URI
    }),
  };
} else {
  config = {
    json_file_store: ((process.env.TOKEN) ? './db_slack_bot_ci/' : './db_slack_bot_a/'), //use a different name if an app or CI
  };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
  //Treat this as a custom integration
  var customIntegration = require('./lib/custom_integrations');
  var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
  var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
  //Treat this as an app
  var app = require('./lib/apps');
  var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
  console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
  process.exit(1);
}

module.exports.controller = controller
var plugin_helpers = []

/*///////////////////*
 *      Plugins      *
 *///////////////////*

// Add plugins here
list_management_plugin = require('./plugins/list_management.js')

// Add help documentation here
plugin_helpers.push(list_management_plugin.help)

// Bot stuff:
function help(plugin, query){
  var plugin_name = ''
  var msg = ''
  var found_help = false
  
  if (plugin && !query){
    var plugin_found = false
    plugin_helpers.forEach(function(this_plugin){
      if (this_plugin['plugin_name'] == plugin){
        found_help   = true
        plugin_found = true
        plugin_name  = this_plugin['plugin_description']
        msg = this_plugin['basic_help']
      }
    });

    if (!plugin_found){
      // Treat this as a command
      plugin_helpers.forEach(function(this_plugin){
        if (this_plugin[plugin]){
          found_help  = true
          plugin_name = "Plugin: " + this_plugin['plugin_name']
          msg += this_plugin[plugin]
        }
      });
    }
  }

  if (plugin && query){
    plugin_helpers.forEach(function(this_plugin){
      if (this_plugin['plugin_name'] == plugin && this_plugin[query]){
        found_help  = true
        plugin_name = ''
        msg = this_plugin[[query]]
      }
    });
  }

  if (!plugin && !query){
    found_help = true
    msg = "To use the help command you can say 'help [plugin_name]' to view basic help for a plugin, or 'help [plugin_name] [command]' to view detailed info for a command in a specific plugin. Alternatively, you can just use 'help [command]' to get detailed help for a command across all plugins. Here's a list of currently installed plugins:\n\n"
    plugin_helpers.forEach(function(this_plugin){
      msg += "\t- " + this_plugin['plugin_name'] + "\n"
    });   
  }

  if (!found_help){
    var reply_with_attachments = {
      'username': 'atls help',
      'text': 'I couldn\'t find anything to help you. Try using `help` without any parameters.'
    }
  }else{
    var reply_with_attachments = {
      'username': 'atls help',
      'text': '',
      'attachments': [
        {
          'fallback': plugin_name,
          'title': plugin_name,
          'text': msg,
          'color': 'good'
        }
      ]
    }

  }
  return reply_with_attachments
}

// https://github.com/howdyai/botkit/issues/261
function start_rtm(bot) {
  bot.startRTM(function(err,bot,payload) {
    if (err) {
      console.log('Failed to start RTM')
      return setTimeout(start_rtm, 60000);
    }
    console.log("** RTM api reconnected!");
    });
}

// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function(bot) {
  console.log('** The RTM api just closed, attempting to reconnect.');
  start_rtm(bot)
});

/**
 * Core bot logic goes here!
 */
controller.on('bot_channel_join', function(bot, message) {
  bot.reply(message, "Howdy! You can talk to me in this channel, but unless everyone needs to see my responses you should message me in private :simple_smile:")
});

// greetz
controller.hears([/^h(ey|i|ola|owdy|ello)/i], 'direct_message,direct_mention', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'wave',
  }, function(err) {
    if (err) {
      reply_err(message)
    }
  });
});

// help [plugin_name] [cmd]
controller.hears([/^help\s*([A-Za-z0-9-_]+)?\s*([A-Za-z0-9-_]+)?\s*$/i], 'direct_message,direct_mention', function(bot, message) {
  var plugin = null
  var query  = null
  
  if (message.match[1]) plugin = message.match[1].toLowerCase()
  if (message.match[2]) query  = message.match[2].toLowerCase()

  msg = help(plugin, query)
  bot.reply(message, msg)
});

// If we wind up here, we couldn't handle the user's command.
controller.on('direct_message,mention,direct_mention', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'question',
  }, function(err) {
    if (err) {
      reply_err(message)
      return;
    }

    bot.startPrivateConversation(message, function(err, dm) {
      dm.say('I don\'t know how to handle your last message (I won\'t recognize commands if the syntax isn\'t right). Try asking for help with `help [command]`');
    });
  });
});
