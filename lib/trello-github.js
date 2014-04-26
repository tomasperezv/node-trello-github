/**
 * Facade that encapsulates the interactions with the github and trello API's.
 *
 * @author Tomas Perez <tom@0x101.com>
 * @class TrelloGithub
 */
var config = require('node-config').get('config'),
		Log = require('node-log'),
		Trello = require('node-trello'),
		GitHubApi = require('github');

/**
 * @constructor
 */
TrelloGithub = function() {

	/**
	 * @var Trello _trelloAPI
	 * @private
   */
	this._trelloAPI = new Trello(config.trello.key, config.trello.token);

	/**
	 * @var GitHubAPI _githubAPI
	 * @private
   */
	this._githubAPI = new GitHubApi({
		version: "3.0.0",
		timeout: config.github.timeout
	});

};

/**
 * @param {String} boardId
 * @param {Function} callback
 * @method readTrelloBoard
 * @public
 */
TrelloGithub.prototype.readTrelloBoard = function(boardId, callback) {

	if (typeof callback !== 'function') {
		throw new Error('Invalid callback function.');
	}

	this._trelloAPI.get('/1/boards/' + boardId + '/cards/', function(err, data) {
		var result = data.map(function(current) {
			return {
				list: current.idList,
				closed: current.closed,
				id: current.id,
				name: current.name,
				date: current.due,
				url: current.shortUrl,
				labels: current.labels
			};
		});
		callback(undefined, result);
	});

};

module.exports = TrelloGithub;
