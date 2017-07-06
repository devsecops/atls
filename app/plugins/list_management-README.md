## List Management Plugin

### Overview
This plugin allows users to create lists of links with titles and descriptions, but with much more control. 

Role-based security allows fine tuned access control allowing teams to keep certain lists of resources restricted to those with need to know and/or need to modify. Each list has its own owner, admins, members and subscribers, as well as scope (public, private, personal).

#### Scopes
*Public* lists are viewable by everyone, you do not need to be a member of the list to view and search.

*Private* lists are restricted to the owner, admins and members. The list is not viewable by anyone that has not been explicitly added. If a public list was converted to a private list, any subscribers who are not members of the list will not receive notifications.

*Personal* lists are restricted to individual users and cannot be converted to public or private.

#### Roles
*Owner* is automatically set to the user who created a list. A list can only have one owner, and the `transfer` command can be used to transfer ownership to another user. Owners have the same ability as admins, but also have the exclusive ability to transfer ownership to someone else, as well as delete a list.

*Admins*, by default, will only contain the user who created the list. An owner or admin can add or remove additional admins, but admins cannot modify the owner of a list. The purpose of the admin role is to allow certain users the ability to add, remove or edit entries in the list, as well as add and remove members.

*Members* are used for private lists. While all users can view public lists, a private list cannot be viewed unless you are a member (or owner/admin). 

*Slack Team Owners & Admins* are considered superusers and, while they cannot view private lists they are not a member of natively, they can perform the same actions as an owner across every list. This is meant to provide a way to maintain lists that may have lost all owners or admins.

#### Groups
Coming soon! This feature will provide two types of groups:

*List Groups* will allow you to group different lists under one list group name. This makes it easy to search across a collection of lists rather than searching through each one individually.

*User Groups* will allow you to create groups of users, and add those group names as an admin or member of a list. This will make it easy to add groups, such as your team, to multiple lists and only have to modify the group to add or remove users rather than doing this across various lists.

### Commands
*create* - Syntax: `create [public|private|personal] [list|group]`

Create allows you to create a new list or group. When creating lists, the creator is the owner, an admin and a member by default. You must specify the scope when creating the list. Public allows any user to view a lists contents, while private lists can only be viewed by owners, admins or members of that list. In both cases, only an owner or admin can add to or edit links in a list or add and remove admins, while the list itself can only be deleted by an owner. Personal lists can only be viewed by the user it belongs to and cannot be converted to a public or private list.

*list* - Syntax: `list list_name [add]`

List will show you the contents of a list (if you have access to it). To add a new entry to a list, just pass in the add parameter. You must have the owner or admin role to add to a list.

*search* - Syntax: `search list_name query`

Search allows you to search through a list for a keywords. It will return results if they match any field (title, url or description).

*edit* - Syntax: `edit list_name query`

Edit works like search but returns action buttons allowing you to edit or delete an entry. Only an owner or admin can edit a list.

*subscribe* - Syntax: `sub(scribe) list_name`

Subscribe (or 'sub' for short) will subscribe you to a list. By subscribing, you will be notified whenever a new link is added to a list. Subscription notices are not sent to you if you add an entry to a list you also subscribe to.

*unsubscribe* - Syntax: `unsub(scribe) list_name`

Unsubscribe (or 'unsub' for short) will unsubscribe you from a list.

*delete* - Syntax: `del(ete) [list] list_name`

Delete (or 'del' for short) will delete a list. Only the owner of a list can delete it. While group functionality is still in the works, this command will eventually handle the deletion of groups.

*convert* - Syntax: `convert list_name [public|private]`

Converts a public list to private and vice versa. Personal lists cannot be converted.

*transfer* - Syntax: `transfer list_name @new_owner`

Transfers ownership of a list to another user. Be sure to include the @ before the username!

*set* - Syntax: `set list_name [admin|member]`

Set is used to add a new admin or member to a list. Only a list owner or admin can use this feature. Be sure to include the @ before the username!

*remove* - Syntax: `remove list_name [admin|member] @username`

Removes a user's admin role or membership from a list. Only a list owner or admin can use this feature. Be sure to include the @ before the username!

*export* - Syntax: `export list_name`

This will upload an HTML bookmarks file of a list that you can download and import to your browser.

*show* - Syntax: `show [public|private|owner|admin|member|subscriber]`

Shows you the lists you have access to by scope. For example, show private will return all the private lists you can access, while show subscriber returns the lists you are subscribed to.
