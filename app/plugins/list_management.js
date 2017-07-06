var controller = module.parent.exports.controller
var basic_help = `Create a list:
	create [public|private|personal] [list|group] list_name

List the contents of a list, or add a new entry:
	list list_name [add]

Search a list:
	search list_name query

Edit or delete an entry from a list:
	edit list_name query

Subscribe to a list:
	sub(scribe) list_name

Unsubscribe from a list:
	unsub(scribe) list_name

Delete a list:
	del(ete) [list] list_name

Convert a list:
	convert list_name [public|private]

Transfer ownership of a list:
	transfer list_name @new_owner

Grant a user admin/membership to a list:
	set list_name [admin|member] @username

Remove a user's admin/membership from a list:
	remove list_name [admin|member] @username

Export a bookmark file for a list:
	export list_name

Show what lists you can access (by scope):
	show [public|private|owner|admin|member|subscriber]`

module.exports.help = {
  'basic_help': basic_help,
  'plugin_name': 'list_management',
  'plugin_description': 'This plugin allows users to create and manage lists of links with titles and descriptions, plus a whole lot of control!',
  'create': 'Syntax: create [public|private|personal] [list|group]\n\nCreate allows you to create a new list or group. When creating lists, the creator is the owner, an admin and a member by default. You must specify the scope when creating the list. Public allows any user to view a lists contents, while private lists can only be viewed by owners, admins or members of that list. In both cases, only an owner or admin can add to or edit links in a list or add and remove admins, while the list itself can only be deleted by an owner. Personal lists can only be viewed by the user it belongs to and cannot be converted to a public or private list.\n\nUser and list groups are still in the works, check back soon!',
  'list': 'Syntax: list list_name [add]\n\nList will show you the contents of a list (if you have access to it). To add a new entry to a list, just pass in the add parameter. You must have the owner or admin role to add to a list.',
  'search': 'Syntax: search list_name query\n\nSearch allows you to search through a list for a keywords. It will return results if they match any field (title, url or description).',
  'edit': 'Syntax: edit list_name query\n\nEdit works like search but returns action buttons allowing you to edit or delete an entry. Only an owner or admin can edit a list.',
  'sub': 'Syntax: sub(scribe) list_name\n\nSubscribe (or \'sub\' for short) will subscribe you to a list. By subscribing, you will be notified whenever a new link is added to a list. Subscription notices are not sent to you if you add an entry to a list you also subscribe to.',
  'subscribe': 'Syntax: sub(scribe) list_name\n\nSubscribe (or \'sub\' for short) will subscribe you to a list. By subscribing, you will be notified whenever a new link is added to a list. Subscription notices are not sent to you if you add an entry to a list you also subscribe to.',
  'unsub': 'Syntax: unsub(scribe) list_name\n\nUnsubscribe (or \'unsub\' for short) will unsubscribe you from a list.',
  'unsubscribe': 'Syntax: unsub(scribe) list_name\n\nUnsubscribe (or \'unsub\' for short) will unsubscribe you from a list.',
  'del': 'Syntax: del(ete) [list] list_name\n\nDelete (or \'del\' for short) will delete a list. Only the owner of a list can delete it. While group functionality is still in the works, this command will eventually handle the deletion of groups.',
  'delete': 'Syntax: del(ete) [list] list_name\n\nDelete (or \'del\' for short) will delete a list. Only the owner of a list can delete it. While group functionality is still in the works, this command will eventually handle the deletion of groups.',
  'convert': 'Syntax: convert list_name [public|private]\n\nConverts a public list to private and vice versa. Personal lists cannot be converted.',
  'transfer': 'Syntax: transfer list_name @new_owner\n\nTransfers ownership of a list to another user. Be sure to include the @ before the username!',
  'set': 'Syntax: set list_name [admin|member]\n\nSet is used to add a new admin or member to a list. Only a list owner or admin can use this feature. Be sure to include the @ before the username!',
  'remove': 'Syntax: remove list_name [admin|member] @username\n\nRemoves a user\'s admin role or membership from a list. Only a list owner or admin can use this feature. Be sure to include the @ before the username!',
  'export': 'Syntax: export list_name\n\nThis will upload an HTML bookmarks file of a list that you can download and import to your browser.',
  'show': 'Syntax: show [public|private|owner|admin|member|subscriber]\n\nShows you the lists you have access to by scope. For example, show private will return all the private lists you can access, while show subscriber returns the lists you are subscribed to.'
}

function not_found(bot, message){
  bot.startPrivateConversation(message, function(err, dm) {
    dm.say('I couldn\'t find that list ¯\\_(ツ)_/¯')
  });
}

// Generates a random color (http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript)
function getRandomColor() {
    var letters = '0123456789ABCDEF'
    var color = '#'
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

// Checks to see if the calling user is allowed to access a list
// Returns (true|false)
function can_access_list(user, data){
  if (data['scope'] == 'public'){
    return true
  }
  else if (data['scope'] == 'private'     &&
      data['owner'] != user               &&
      data['admins'].indexOf(user)  == -1 &&
      data['members'].indexOf(user) == -1){
        return false
      }else{
        return true
      }
}

// Checks to see if the calling user is a privileged user for a list
// Returns (true|false)
function is_privileged(user, data){
  if (data['owner'] != user               &&
      data['admins'].indexOf(user)  == -1){
        return false
      }else{
        return true
      }
}

function reply_err(message){
  bot.startPrivateConversation(message, function(err, dm) {
    dm.say('Something went wrong :disappointed:\nIf this keeps happening, contact a Slack team admin.')
  });
}

// create [public|private|personal] [list_name]
controller.hears([/^create\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)?\s*(.*)$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  var scope = message.match[1].toLowerCase() // public|private|personal
  var type  = message.match[2].toLowerCase()  // list|group

  if (scope.search(/(public|private|personal)/i) == -1 || type.search(/(list|group)/i) == -1) {
    bot.reply(message, 'That doesn\'t look quite right :thinking_face:\nTry this: `create [personal|public|private] [list|group] [list name]`')
    return
  }

  if (message.match[3] == undefined && scope != 'personal') {
    bot.reply(message, 'Looks like you forgot to give me a name :thinking_face:')
    return
  }

  if (scope.search(/^personal$/i) != -1 && type.search(/^list$/i) != -1){
    var name = message.user.toLowerCase()
  }else{
    var name = message.match[3].toLowerCase()
  }

  if (name.search(/---/) != -1) {
    bot.reply(message, 'Sorry, names can\'t contain three or more consecutive dashes (`---`), this is a reserved character sequence.')
    return
  }

  if (name.search(/^(deleted|list|group|public|private|personal|owner|admin|sub(scription(s)?)?)$/i) != -1) {
    bot.reply(message, 'Sorry, that\'s a reserved word. Please choose a different name.')
    return
  }

  // Check to see if the requested list name already exists. (Will need to modify for groups [groupid instead of id?])
  controller.storage.teams.get(name, function(err, data){
    if(err){
      reply_err(message)
      return
    }else{ // This needs to be nested in the .get, otherwise conditions are evaluated before the storage check returns and we can't control flow
      if (data){
        bot.reply(message, 'Sorry, that name is taken. Please choose a different name.')
        return
      }else{
        var init_list = {
          'id': name,
          'scope': scope,
          'created': message.ts,
          'owner': message.user,
          'admins': [message.user],
          'subscribers': [],
          'members': [message.user],
          'links': []
        }

        controller.storage.teams.save(init_list)

        var msg = 'Okay, I created a ' + scope
        if (scope.search(/^personal$/i) != -1){
          msg += ' list for you. Personal lists are nameless and limited to one per user. If you need more, you can always create a new private list.'
        } else {
          msg += ' ' + type + ' called `' + name + '`'
        }
        bot.reply(message, msg)
      }
    }
  });
});

// list list_name [add]
controller.hears([/^list\s+([A-Za-z0-9_-]+)\s*([A-Za-z]+)?\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
    name = message.match[1].toLowerCase()
    if (name.search(/^personal$/i) != -1) name = message.user
    if (message.match[2] && message.match[2].search(/^add$/i) != -1)  var add  = true

    controller.storage.teams.get(name, function(error, data) {
        if (error) {
          reply_err(message)
          return
        }

        if (!data){
          not_found(bot, message)
          return
        }

        if (!can_access_list(message.user, data)){
          bot.reply(message, 'Sorry, you don\'t have access to that list.')
          return
        }

        // Adds a new entry to a list
        if (add) {
          var url = null
          var url_name = null

          if (!is_privileged(message.user, data)){
            bot.startPrivateConversation(message, function(err, dm) {
              dm.say('Sorry, you need to be an admin of that list to add a new link.')
            });
            return
          }

          askURL = function(response, convo) {
            convo.ask('What\'s the URL?', function(response, convo) {
              // If the URL is valid, we'll see something like:
              // <http://www.example.com> or <http://www.example.com|example.com>
              var url_regex = /^<([^>]*)>$/
              url_resp = response.text.match(url_regex)
              if (url_resp !== null) {
                url = url_resp[1]
                if (url.includes('|')){ // <http://example.com|example.com>
                  splits = url.split('|')
                  url = splits[0]
                }
                if (url.length > 1008){ // +8 for protocol://
                  convo.say('That\'s a long URL! :open_mouth: I\'ll need something under 1000 characters.')
                  convo.repeat()
                  convo.next()
                  return
                }
                askName(response, convo)
              } else {
                convo.say('That doesn\'t look like a valid URL, let\'s try again. Be sure to supply a single URL only without extra text or characters.')
                convo.repeat()
                convo.next()
                return
              }
              convo.next()
            });
          }

          askName = function(response, convo) {
            convo.ask('Next, I\'ll need a name for this link.', function(response, convo) {
              if (response.text.length > 50){
                convo.say('That\'s a long name! :open_mouth: Names should be less than 50 characters. Let\'s try again:')
                convo.repeat()
                convo.next()
                return
              }
              url_name = response.text.replace(/`/g,'\'') // no backticks in names
              url_name = url_name.replace(/\n/g,'') // strip out newlines
              askDesc(response, convo)
              convo.next()
            });
          }

          askDesc = function(response, convo) {
            convo.ask('You can also add a description or notes (200 characters max). This is useful for identifying points of contact or network/vpn requirements for a resource, authentication types (ie: local/domain. *Do not store passwords here!*),  etc.\n\nExample: `Dev site for AwesomeApp 2.0, must be on VPN to connect. Contact bob@example.com for access.`\n\nTo leave this blank, just reply with `blank`', function(response, convo) {
              desc = response.text

              if (desc.length > 200){
                convo.say('That\'s a long description! :open_mouth: You\'ll need to cut that down to 200 characters max. Let\'s try again:')
                convo.repeat()
                convo.next()
                return
              }

              var blank_regex = /^blank$/i
              if (desc.match(blank_regex)) desc = ''
              previewLink(response, convo)
              convo.next()
            });
          }

          previewLink = function(response, convo) {
            var reply_with_attachments = {
              'username': 'atls',
              'text': 'Here\'s a preview of your new addition. If everything looks good, reply with `save`. Or, reply with anything else (ie: `cancel`) to throw away this link.',
              'attachments': [
                {
                    'fallback': url_name + ' - ' + url,
                    'title': url_name + ' - ' + url,
                    'text': desc,
                    'color': getRandomColor()
                }
              ],
              'icon_url': 'https://www.google.com/s2/favicons?domain_url=' + url
            }

            convo.ask(reply_with_attachments, function(response, convo) {
              var cmd = response.text.toLowerCase()
              if (cmd == 'save'){
                // TODO -v could include created on/by: /^(.*)-(U.*)$/
                var link_id = message.ts + "-" + message.user
                var new_item = {
                  'id': link_id,
                  'title': url_name,
                  'url': url,
                  'description': desc
                }
                data['links'].push(new_item)
                controller.storage.teams.save(data)
                convo.say('Awesome, your link has been saved!')

                // Notify subscribers
                if (message.match[1].search(/^personal$/i) == -1){
                  reply_with_attachments['text'] = 'A new link was just added to the list `' + data['id'] + '` by <@' + message.user + '>:'
                  data['subscribers'].forEach(function(subuser){
                    // We don't need to notify the person who just added the link or non-member subscribers
                    if (subuser == message.user || !can_access_list(subuser, data)) return

                    // https://github.com/howdyai/botkit/issues/422
                    bot.api.im.open({
                      user: subuser
                      }, (err, res) => {
                        if (err) {
                          console.log('Failed to open IM with user', err)
                          return
                        }
                        bot.startConversation({
                          user: subuser,
                          channel: res.channel.id,
                          text: 'text'
                        }, (err, subconvo) => {
                          // Workaround for convo.say bug
                          bot.reply(subconvo.source_message, reply_with_attachments)
                          subconvo.stop()
                        });
                      });
                  });
                }

              }else{
                convo.say('Cool, we won\'t save that :sunglasses:')
              }
              convo.next()
            });
          }

          bot.startConversation(message, askURL)

        }else{

          if (data['links'].length > 0) {
            bot.startPrivateConversation(message, function(err, dm) {
              var num = data['links'].length + ' result'
              if (data['links'].length > 1) num += 's'
              var reply_with_attachments = {
                'username': 'atls',
                'text': 'There\'s ' + num + ' in this list:',
                'attachments': [],
                'icon_url': 'https://www.google.com/s2/favicons?domain_url=' + data['links'][0]['url']
              }

              data['links'].forEach(function(element){
                var desc = element['description'] || ''
                var link = {
                    'fallback': element['title'] + ' - ' + element['url'],
                    'title': element['title'] + ' - ' + element['url'],
                    'text': desc,
                    'color': getRandomColor()
                  }
                reply_with_attachments['attachments'].push(link)
              });
              dm.say(reply_with_attachments)
            });
          } else {
            bot.startConversation(message, function(err, dm) {
              dm.say('This list has no content. Try adding some with `list list_name add`')
            });
            return
          }
        }
    });
});

// search list_name query
// edit list_name query
controller.hears([/^(search|edit)\s+([A-Za-z0-9_-]+)\s*([A-Za-z0-9\s_-]+)?\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  var cmd   = message.match[1].toLowerCase()
  var name  = message.match[2].toLowerCase()
  var query = message.match[3]

  controller.storage.teams.get(name, function(error, data) {
    if (error) {
      reply_err(message)
      return
    }

    if (!data){
      not_found(bot, message)
      return
    }

    // Checks if the list is private and the calling user isn't an owner/admin/member
    if (data['scope'] == 'private' && !can_access_list(message.user, data) ) {
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say('That list is private, you need to be a member to view its contents.')
      });
      return
    }

    // Checks if the calling user wants to edit and isn't a list owner or admin
    if (cmd == 'edit' && !is_privileged(message.user, data)){
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say('Sorry, only list owners or admins can edit that list.')
      });
      return
    }

    if (query == undefined){
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say('Whoops! Looks like you forgot to specify a valid search term :thinking_face:')
      });
      return
    }else{
      query = query.toLowerCase()
    }

    // Look for matches in the specified list
    var matches = []
    if (name.search(/^personal$/) != -1) name = message.user
    data['links'].forEach(function(element){
      // indexOf lets us do an easy (read: lazy) case-insensitive search for variables
      if (element['title'].toLowerCase().indexOf(query) != -1 || 
          element['url'].toLowerCase().indexOf(query)   != -1 || 
         (element['description'] &&
          element['description'].toLowerCase().indexOf(query) != -1)) matches.push(element)
    });

    // Return results in a single message with each result as an attachment
    if (matches.length > 0) {
      var num = matches.length + ' result'
      if (matches.length > 1) num += 's'
      var reply_with_attachments = {
        'username': 'atls',
        'text': 'I found ' + num + ':',
        'attachments': [],
        'icon_url': 'https://www.google.com/s2/favicons?domain_url=' + matches[0]['url']
      }

      matches.forEach(function(element){
        var desc = element['description'] || ''
        var link = {
            fallback: element['title'] + ' - ' + element['url'],
            title: element['title'] + ' - ' + element['url'],
            text: desc,
            color: getRandomColor(),
        }

        if (cmd == 'edit'){
          link['callback_id'] = name + "---" + element['id']
          link['actions'] = [{
                              name: "edit",
                              text: "Edit",
                              value: "edit",
                              type: "button"
                            },
                            {
                              name: "delete",
                              text: "Delete",
                              value: "delete",
                              type: "button",
                              style: "danger",
                              confirm: {
                                title: "Are you sure?",
                                text: "This link will be permanently deleted!",
                                ok_text: "Yes",
                                dismiss_text: "No"
                              }
                            }]
        }
        reply_with_attachments['attachments'].push(link)
      });
      // Show search results for public lists in the channel the search was issued in
      if (cmd == 'search' && data['scope'] == 'public'){
        bot.reply(message, reply_with_attachments)
      }else{ // Personal/private list search results and all edits should be done in dm
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say(reply_with_attachments)
        });
      }
    } else {
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say('I couldn\'t find any results for your search query. :disappointed:')
      });
      return
    }
  });
});

// sub(scribe) list_name
// unsub(scribe) list_name
controller.hears([/^((?:un)?sub(?:scribe)?)\s+([A-Za-z0-9_-]+)?\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  var cmd = message.match[1].toLowerCase()

  if (message.match[2] == undefined) {
    bot.startPrivateConversation(message, function(err, dm) {
      dm.say('Looks like you forgot to give me a list name :thinking_face:\n\nTry this: `' + cmd + ' list_name`')
    });
    return
  }

  var list = message.match[2].toLowerCase()
  if (list == 'personal') {
    bot.startPrivateConversation(message, function(err, dm) {
      dm.say('This feature isn\'t available for personal lists.')
    });
    return
  }

  controller.storage.teams.get(list, function(error, data) {
      if (error) {
        reply_err(message)
        return
      }

      if (!can_access_list(message.user, data)){
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say('Sorry, you don\'t have access to that list.')
        });
        return
      }

      if (cmd.startsWith('sub')){ // Subscribe
        if (data['subscribers'].indexOf(message.user) != -1){
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('You already subscribed to that list :simple_smile:')
          });
        }else{
          data['subscribers'].push(message.user);
          controller.storage.teams.save(data);
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Okay, you are now subscribed to `' + list + '`')
          });
        }

      }else{ // Unsubscribe

        if (data['subscribers'].indexOf(message.user) == -1){
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('You aren\'t subscribed to that list :simple_smile:')
          });
        }else{
          data['subscribers'].splice(data['subscribers'].indexOf(message.user), 1)
          controller.storage.teams.save(data)
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Okay, you are no longer subscribed to `' + list + '`')
          });
        }
      }
  });
});

// del(ete) [list|group] list_name
controller.hears([/^del(?:ete)?\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  var type = message.match[1].toLowerCase()
  var name = message.match[2].toLowerCase()

  if (type.search(/(list|group)/i) == -1) {
    bot.reply(message, 'That doesn\'t look quite right :thinking_face:\nTry this: `del [list|group] [name]`')
    return
  }

  if (name.search(/^personal$/i) != -1 && type.search(/^list$/i) != -1) var name = message.user.toLowerCase()
  controller.storage.teams.get(name, function(err, data){
    if(err){
      reply_err(message)
      return
    }
    if (data){
      if (!can_access_list(message.user, data)){
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say('Sorry, you don\'t have access to that list.')
        });
        return
      }

      bot.api.users.info({user: message.user}, (error, response) =>{
        if (data['owner'] != message.user && !response['user']['is_owner'] && !response['user']['is_admin']){
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Only the list\'s owner (and the Slack team owners or admins) can delete that list.')
          });
        }else{
          bot.startConversation(message, function(err, convo) {
            convo.ask('Are you sure you want to delete this list? This can\'t be undone. If you want to continue, reply with `delete`. Reply with anything else (ie: `cancel`) to keep the list.', function(response, convo) {
              if(response.text.search(/^delete$/i) != -1){
                // botkit's mongo storage driver doesn't support .delete so we need to eval ):
                // Double check before using eval, just in case (:
                if (name.search(/[^A-Za-z0-9_-]/) != -1){
                  bot.reply(message, 'I\'m sorry Dave, I\'m afraid I can\'t do that.')
                  return
                }
                var exec = require('child_process').exec
                // With this workaround it might not be safe to add more than one slack team per bot
                // TODO find a better way to delete collections
                dlist = "mongo admin --eval \"db.teams.remove({'id':'" + name + "'})\""
                exec(dlist, function callback(error, stdout, stderr){
                  if (error){
                    reply_err(message)
                    return
                  }else{
                    bot.startPrivateConversation(message, function(err, dm) {
                      dm.say('Okay, I deleted the list `' + name + '`')
                    });
                  }
                });
              }else{
                bot.startPrivateConversation(message, function(err, dm) {
                  dm.say('Okay, we\'ll keep that list for now :simple_smile:')
                });
              }
              convo.next()
            });
          });
        }
      });

    }else{
      not_found(bot, message)
      return
    }
  });
});

// convert list_name [public|private]
controller.hears([/^convert\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  var name = message.match[1].toLowerCase()
  var scope = message.match[2].toLowerCase()

  if (name == 'personal'){
    bot.startPrivateConversation(message, function(err, dm) {
      dm.say('Sorry, personal lists can\'t be converted.')
    });
    return
  }

  if (scope != 'public' && scope != 'private'){
    bot.reply(message, 'That doesn\'t look quite right :thinking_face:\nTry this: `convert list_name [public|private]`')
    return
  }

  controller.storage.teams.get(name, function(err, data){
    if(err){
      reply_err(message)
      return
    }

    if (data){
      if (!can_access_list(message.user, data)){
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say('Sorry, you don\'t have access to that list.')
        });
        return
      }

      bot.api.users.info({user: message.user}, (error, response) =>{
        if (data['owner'] != message.user && (!response['user']['is_owner'] || !response['user']['is_admin'])){
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Only the list\'s owner (and the Slack team owners or admins) can convert that list.')
          });
        }else{
          if (scope == data['scope']){
            bot.startPrivateConversation(message, function(err, dm) {
              dm.say('That list is already ' + scope)
            });
            return
          }

          data['scope'] = scope
          controller.storage.teams.save(data)
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Okay, the list `' + name + '` is now ' + scope)
          });
        }
      });
    }else{
      not_found(bot, message)
    }
  });
});

// transfer list_name @new_owner
controller.hears([/^transfer\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9<@>_-]+)\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  var name = message.match[1].toLowerCase()
  var new_owner = message.match[2]

  if (name == 'personal'){
    bot.startPrivateConversation(message, function(err, dm) {
      dm.say('Sorry, personal lists can\'t be transferred.')
    });
    return
  }

  var uid_regex = /^<@(U[A-Za-z0-9]{8})>$/i
  uid_search = new_owner.match(uid_regex)
  if (!uid_search){
    bot.reply(message, 'That doesn\'t look quite right. You\'ll need to specify a single user, including the @ before their username.\nExample: `transfer my-list @new_owner`')
    return
  }else{
    new_owner = uid_search[1]
  }

  controller.storage.teams.get(name, function(err, data){
    if(err){
      reply_err(message)
      return
    }

    if (data){
      if (!can_access_list(message.user, data)){
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say('Sorry, you don\'t have access to that list.')
        });
        return
      }

      bot.api.users.info({user: message.user}, (error, response) =>{
        if (!is_privileged(message.user, data)){
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Only the list\'s owner (and the Slack team owners or admins) can transfer that list.')
          });

        }else{

          if(new_owner == data['owner']){
            bot.startPrivateConversation(message, function(err, dm) {
              dm.say('You\'re already the owner, no need to transfer that list to yourself :simple_smile:')
            });
            return
          }

          askOwner = function(response, convo) {
            convo.ask('Are you sure you want to transfer the list `' + name + '` to <@' + new_owner + '>? This can only be reversed by the new owner, or a Slack team owner or admin. If you want to continue, reply with `transfer`. Any other response (ie: `cancel`) will cancel the transfer.', function(response, convo) {
              if (response.text.toLowerCase() == 'transfer'){
                data['owner'] = new_owner
                controller.storage.teams.save(data)
                bot.reply(message, 'Okay, `' + name + '` is now owned by <@' + new_owner + '>')
              }else{
                bot.reply(message, 'Cool, you\'re still in charge of `' + name + '` :simple_smile:')
              }
              convo.next()
            });
          }
          bot.startConversation(message, askOwner)
        }
      });
    }else{
      not_found(bot, message)
    }
  });
});

// set [list_name|group_name] [admin|member] @username
// remove [list_name|group_name] [admin|member] @username
controller.hears([/^(set|remove)\s+([A-Za-z0-9_-]*)\s*([A-Za-z0-9_-]*)\s*([A-Za-z0-9<@>_-]*)\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  cmd  = message.match[1].toLowerCase()
  name = message.match[2].toLowerCase()
  role = message.match[3].toLowerCase()
  user = message.match[4]
  uid_regex = /^<@(U[A-Za-z0-9]{8})>$/i
  uid_search = user.match(uid_regex)

  if (role.search(/^(admin|member)$/i) == -1 || !uid_search){
    bot.reply(message, 'That doesn\'t look quite right :thinking_face:\nTry this: `set [list|group name] [admin|member] @username`')
    return
  }else{
    user = uid_search[1]
    controller.storage.teams.get(name, function(err, data){
      if(err){
        reply_err(message)
        return
      }

      if (data){
        if (!can_access_list(message.user, data) || !is_privileged(message.user, data)){
          bot.startPrivateConversation(message, function(err, dm) {
            dm.say('Sorry, only the list\'s owner or admins can use this feature.')
          });
          return
        }

        switch (role){
          case 'admin':
          if (data['admins'].indexOf(user) != -1){
            if (cmd == 'set'){
              bot.startPrivateConversation(message, function(err, dm) {
                dm.say('<@' + user + '> is already an admin for that list.')
              });
              return
            }else{
              data['admins'].splice(data['admins'].indexOf(user), 1)
            }
          }else{ //user isnt already in the list
            if (cmd == 'remove'){
              bot.startPrivateConversation(message, function(err, dm) {
                dm.say('<@' + user + '> is not an admin for that list.')
              });
              return
            }else{
              data['admins'].push(user)
            }
          }
          break

          case 'member':
          if (data['members'].indexOf(user) != -1){
            if (cmd == 'set'){
              bot.startPrivateConversation(message, function(err, dm) {
                dm.say('<@' + user + '> is already a member of that list.')
              });
              return
            }else{
              data['members'].splice(data['members'].indexOf(user), 1)
            }
          }else{
            if (cmd == 'remove'){
              bot.startPrivateConversation(message, function(err, dm) {
                dm.say('<@' + user + '> is not a member of that list.')
              });
              return
            }else{
              data['members'].push(user)
            }
          }
          break
        }

        var action = cmd == 'remove' ? 'removed from' : 'given'

        controller.storage.teams.save(data)
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say('Okay, <@' + user + '> was ' + action + ' the `' + role + '` role for the list `' + name + '`')
        });
      }else{
        not_found(bot, message)
      }
    });
  }
});

// show [public|private|owner|admin|member|subscriber]
controller.hears([/^show\s+(.*)\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  type = message.match[1].toLowerCase()
  msg = ''
  lists = []
  // Looks messy, but if we don't do it this way conditions are
  // evaluated before storage checks return and stuff breaks
  if (type.search(/(admin|member|subscriber)/) != -1){
    type += 's'
    controller.storage.teams.find({[type]:message.user},function(error, found){
      found.forEach(function(list){
        if (can_access_list(message.user, list)){
          this_list = list['scope'] == 'private' ? list['id'] + ' `private`' : list['id']
          lists.push(this_list)
        }
      });

      if (lists.length > 0){
        msg = 'You have the `' + message.match[1].toLowerCase() + '` role in ' + lists.length + ' list'
        msg += lists.length > 1 ? 's:\n' : ':\n'

        lists.forEach(function (list,index){
          msg += '\t• ' + list + '\n'
        });
      }else{
        msg = 'You currently don\'t have the `' + message.match[1].toLowerCase() + '` role in any list.'
      }
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say(msg)
      });
    });
  }

  else if (type.search(/(public|private)/) != -1){
    controller.storage.teams.find({'scope':type},function(error, found){
      found.forEach(function(list){
        if (can_access_list(message.user, list)){
          lists.push(list['id'])
        }
      });

      switch (type){
        case 'public':
          msg = 'There\'s ' + lists.length + ' public list'
        break

        case 'private':
          msg = 'You have access to ' + lists.length + ' private list'
        break
      }

      if (lists.length > 0){
        msg += lists.length > 1 ? 's:\n' : ':\n'
        lists.forEach(function (list,index){
          msg += '\t• ' + list + '\n'
        });
      }else{
        msg = 'There doesn\'t appear to be any lists yet, try creating some! :simple_smile:'
      }
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say(msg)
      });
    });
  }

  else if (type == 'owner'){
    controller.storage.teams.find({'owner':message.user},function(error, found){
      found.forEach(function(list){
        this_list = list['scope'] == 'private' ? list['id'] + ' `private`' : list['id']
        lists.push(this_list)
      });

      if (lists.length > 0){
        msg = 'You own ' + lists.length + ' list'
        msg += lists.length > 1 ? 's:\n' : ':\n'
        lists.forEach(function (list,index){
          msg += '\t• ' + list + '\n'
        });
      }else{
        msg = 'You don\'t own any lists.'
      }
      bot.reply(message, msg)
    });
  }else{
    bot.reply(message, 'That doesn\'t look quite right :thinking_face:\n\nTry this `show [public|private|owner|admin|member|subscriber]`')
  }
});


// export list_name
controller.hears([/^export\s+([A-Za-z0-9_-]*)\s*$/i], 'direct_message,mention,direct_mention', function(bot, message) {
  name = message.match[1];

  controller.storage.teams.get(name, function(error, data) {
      if (error) {
        reply_err(message)
        return
      }

      if (!data){
        not_found(bot, message)
        return
      }

      if (!can_access_list(message.user, data)){
        not_found(bot, message) //youtube.com/watch?v=8nvuEw9XcuU
        return
      }
      bookmarks = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>${data['id']}</TITLE>
<H1>${data['id']}</H1>
<DL>
<p>
<DT><H3>${data['id']}</H3>
  <DL>
    <p>\n`;

      data['links'].forEach( function (link, index){
        bookmarks += '      <DT><A HREF="' + link['url'] + '">' + link['title'] + '</A>\n'
      });

      bookmarks += '    </p>\n  </DL>'
      var fname = name + '_' + message.ts + '.html'
      var request = require('request')

      request.post({
          url: 'https://slack.com/api/files.upload',
          formData: {
              token: bot.config.token,
              title: fname,
              filename: fname,
              filetype: 'html',
              channels: message.channel,
              content: bookmarks,
          },
      }, function (err, response) {
          //console.log(JSON.parse(response.body)) //DEBUG
      });
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say('Here you go! Download the HTML snippet, then import it to your browser. Keep in mind, descriptions are not carried over as they are not supported by the bookmarks file.')
      });
    });
});

// Handles button clicks from edit/delete actions
controller.on('interactive_message_callback', function(bot, message) {
  var action   = message.actions[0]['value']
  var callback = message.callback_id.split(/---/)
  var name     = callback[0]
  var link_id  = callback[1]

  controller.storage.teams.get(name, function(error, data) {
      if (error) {
        reply_err(message)
        return
      }

      // Check if the calling user is a list owner or admin
      if (data['owner'] != message.user && data['admins'].indexOf(message.user) == -1){
        bot.startPrivateConversation(message, function(err, dm) {
          dm.say('Sorry, only list owners or admins can edit that list.')
        });
        return
      }

      var link_found = false
      data['links'].forEach(function (link, index){
        if(link['id'] == link_id){
          link_found = true
          var title = data['links'][index]['title']
          var url   = data['links'][index]['url']
          var desc  = data['links'][index]['description']

          if (action == "delete"){
            data['links'].splice(index, 1)
            controller.storage.teams.save(data)
            bot.replyInteractive(message, "Okay, I deleted `" + title + "` from the list.")

          }else if (action == 'edit') {
            bot.replyInteractive(message, 'What part do you want to edit?')

            askEdit = function(response, convo) {
              convo.ask('You can say `title`, `url`, or `description`. Here\'s what we currently have:\n\nTitle: ' + title + '\nURL: ' + url + '\nDescription: ' + desc, function(response, convo) {
                if (response.text.search(/^(title|url|description)$/i) == -1){
                  convo.say('That isn\'t an option, let\'s try again.')
                  convo.repeat()
                }else{
                  editCmd = response.text.toLowerCase()
                  makeEdit(response, convo)
                }
                convo.next()
              });
            }

            makeEdit = function(response, convo) {
              convo.ask('What do you want the new value to be? Title and URL are required values, but you can say `blank` to remove a description.', function(response, convo) {
                switch (editCmd){
                  case 'title':
                    data['links'][index]['title'] = response.text
                    break
                  case 'url':
                    var url_regex = /^<([^>]*)>$/
                    url_resp = response.text.match(url_regex)
                    if (url_resp !== null) {
                      url = url_resp[1]
                      if (url.includes('|')){
                         splits = url.split('|')
                         url = splits[0]
                       }
                    }
                    data['links'][index]['url'] = url
                    break
                  case 'description':
                    var desc = response.text
                    if (response.text.search(/^blank$/i) != -1) desc = ''
                    data['links'][index]['description'] = desc
                    break
                }
                controller.storage.teams.save(data)
                convo.say('Got it! I updated that entry with the new value you provided :simple_smile:')
                convo.next()
              });
            }
           bot.startPrivateConversation(message, askEdit)
          }
      }
    });
    if (!link_found){
      bot.startPrivateConversation(message, function(err, dm) {
        dm.say('I can\'t find that link anymore. Check the list again, it may have already been deleted.')
      });
    }
  });
});
