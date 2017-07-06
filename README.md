# atls

### Overview
atls is a chatbot built on the [Botkit](https://www.botkit.ai/) framework, using the [Easy Peasy Bots](https://medium.com/slack-developer-blog/easy-peasy-bots-getting-started-96b65e6049bf) guide. Originally designed as a list management bot, it has been extended to support plugins making it a versatile minion ready to do your bidding.

### Basic Functionality
At its core, atls doesn't do much. The code from the Slack dev guide has only been modified slightly to support RTM reconnects (sources referenced where applicable), simple greetings and help command functionality. As previously mentioned, plugins are what makes atls work.

### Plugins
Plugins are created by adding your botkit code in a .js file and dropping it in the /plugins directory. You must also activate the plugin by requiring it in index.js, as well as adding help documentation if needed.

[./app/index.js](./app/index.js):
```
/*///////////////////*
 *      Plugins      *
 *///////////////////*

// Add plugins here
list_management_plugin = require('./plugins/list_management.js')

// Add help documentation here
plugin_helpers.push(list_management_plugin.help)
```

To activate a plugin you simply require it under '// Add plugins here'. All users in your Slack team will be able to use the help function, and it will only show them a plugin is installed if the help documentation is added as seen above.

### Help
Help documentation must be exported, like so:
```
module.exports.help = {
    ...
}
```

The required parts are:
```
  'basic_help': 'Basic help shown when someone runs `help plugin_name`',
  'plugin_name': 'your_plugin_name',
  'plugin_description': 'Description'
```

Basic help is shown when someone runs `help plugin_name` with no arguments. The `plugin_name` should be unique and only contain [A-Za-z0-9-_]. This is used if a user looks for help specifically in your plugin with `help plugin_name command`. The `plugin_description` should be kept short and to the point.

Everything else should be in the format of:
```
'command': 'Detailed command help'
```

When using regex's that allow shortend commands (ie: `del` and `delete`) you should add both versions to help.

An example can be seen in [./app/plugins/list_management.js](./app/plugins/list_management.js).

### Before you begin
You'll need to make a couple quick edits:

[./app/.env](./app/.env)
```
CLIENT_ID=1234.5678
CLIENT_SECRET=1234567890
PORT=8080
MONGODB_URI=mongodb://mongodb:27017
```

Follow the Easy Peasy Bots link above to get a bot connected to Slack. You'll need to add your CLIENT_ID and CLIENT_SECRET in the .env file. The PORT value tells botkit what port to run on. Change the port if needed, as well as the mongodb URI. If you plan on using Docker, as outlined below, you should leave the mongodb URI as is. 

### Docker
To get you up and running quickly, we provided Docker files. You'll need to run them with `docker-compose`, but not before making a couple quick edits.

There are two containers, one for mongodb and one for atls and [localtunnel](https://localtunnel.me). Due to some quirks, atls and localtunnel both run from the same container through `./app/etc/entrypoint.sh`. Localtunnel is included in the entrypoint as `./app/etc/run_lt.sh` because it has a tendancy to crash, so it's wrapped in a shell script which allows it to restart automatically as needed.

In `./docker-compose.yml` you will need to change the localtunnel port if you want to use something other than 8080, and the  subdomain to something unique. This should be the same values you configured if you followed the Easy Peasy Bots guide above.

```
environment:
- LT_PORT=8080
- LT_SUBDOMAIN=ChangeMe
```

If you change the port, be sure to reflect it in `docker-compose.yml` as well as `Dockerfile`. When everything is ready to go, just run `docker-compose up` and atls should connect to your Slack team.

#### Volumes
Two volumes are mounted here, one for mongodb at `./db` and one for atls at `./app`. Each time the atls container starts, it will run `npm install`. This will build the dependencies locally on the first run, and any extra dependencies you add after that.

#### Local Development
Because the code is mounted on the host filesystem, it's easy to develop locally and have your changes reflected in Slack whenever they're saved. This is made possible with `nodemon` which watches `./app/index.js` and `./app/plugins/*.js` for changes and restarts as necessary.

### Things to consider
When creating plugins, you'll need to export anything extra you might need access to. Controller is already exported so you can just import it with `var controller = module.parent.exports.controller`

When using `controller.hears` with a regex such as:
```
controller.hears([/^my_command\s+([A-Za-z0-9_-]+)?\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
    ...
}
```
you should always include `\s*` at the tail end before the `$`. This is hepful because Slack likes to suggest usernames that are similar to a command or argument you may be typing, and people (like myself) have a tendancy to just add a space after the argument to prevent it from being translated to a username.

The first time you connect the bot to Slack, you will need to authorize it by going to [https://your_subdomain.localtunnel.me/login](https://your_subdomain.localtunnel.me/login). In some environments, when you click 'Authorize' you may get a gateway timeout error, but if you replace `https://your_subdomain.localtunnel.me` with `http://localhost:PORT` it will authorize and connect. 

Once the bot is intially connected, access tokens are stored in the database which is mounted on the host machine at `./db`, so you should ensure it can't be accessed by unauthorized users. Also, if you 'reset' the database by deleting everything under `./db`, you'll need to re-authorize the bot by going to /login again.

Lastly, if using localtunnel, it can be slow at times depending on your environment. This can cause action buttons (like 'edit' and 'delete' in the list_management.js plugin) to not work. If this happens, just keep trying and it should eventually work, but the code itself is likely not the issue unless you made any modifications to that section of the code.
