node-trello-github
==================

Read tasks from a trello dashboard and store them as issues in a github repository, updating state changes.

## Configuration ##

### 1. Obtain a token for accessing to the github API ###

1. Generate a token, following this [steps](https://help.github.com/articles/creating-an-access-token-for-command-line-use)
2. Update the config.json file, setting the values 'token', 'user' and 'repo' in the 'github' section.

### 2. Obtain a token for accessing to the trello API ###

1. Obtain the developer key for the [Trello api](https://trello.com/1/appKey/generate#)
2. Generate the access token https://trello.com/1/connect?key=PUBLIC_KEY&name=node-trello-github&response_type=token&expiration=never, replacing PUBLIC_KEY by the key obtained in the previous step.
3. Update the config.json file, setting the values 'key' and 'token' in the 'trello' section.

### 3. Create config/config.json based on config/config-example.json ###

```javascript
{

    "github": {
      "token": "",
      "timeout": 3000,
      "user": "",
      "repo": ""
    },  

    "trello": {
      "key": "",
      "token": "", 
      "boardId": "", 
      "listsMapping": {
        "": "Backlog",
        "": "Ready",
        "": "In progress",
        "": "Done"
      }
    }
}

```

### 4. Run the client ###

```shell
$ ./client.js
```
