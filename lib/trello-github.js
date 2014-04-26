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

	this._githubAPI.authenticate({
		type: "oauth",
		token: config.github.token
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

	this._trelloAPI.get('/1/boards/' + boardId + '/cards/?filter=all', function(err, data) {
		var result = data.map(function(current) {

			var label = typeof config.trello.listsMapping[current.idList] !== 'undefined' ?
					config.trello.listsMapping[current.idList] : '';

			return {
				id: current.id,
				comments: current.badges.comments,
				list: current.idList,
				state: current.closed ? 'closed' : 'open',
				name: current.name + ' ' + current.shortLink,
				date: current.due,
				url: current.shortUrl,
				label: label.toLowerCase(),
				category: current.labels.length === 0 ? '' : current.labels[0].name.toLowerCase()
			};
		});
		callback(undefined, result);
	});

};

/**
 * Request and cache the github issues.
 *
 * @param Function callback
 * @param String state
 * @param Object aggregate
 * @method readGithubIssues
 * @public
 */
TrelloGithub.prototype.readGithubIssues = function(callback, state, aggregate) {

	var self = this;

	if (typeof state === 'undefined') {
		state = 'open';
	}

	this._githubAPI.issues.repoIssues({
		user: config.github.user,
		repo: config.github.repo,
		per_page: 5000,
		state: state
	}, function(err, issues) {
		if (typeof callback === 'function') {

			var result = typeof aggregate === 'undefined' ? {} : aggregate;

			for (var i = 0; i < issues.length; i++) {
				result[issues[i].title] = issues[i];
			}

			if (state === 'open') {
				self.readGithubIssues(callback, 'closed', result);
			} else {
				callback(result);
			}
		}
	});

};

/**
 * Check if a card has a github issue already assigned:
 * - If there is, it updates its state.
 * - Otherwise will create a new one
 * @param {Object} issues
 * @param {String} boardId
 * @param {Function} callback
 * @method readTrelloBoard
 * @public
 */
TrelloGithub.prototype.upsertCard = function(issues, cardData) {

	if (cardData.name in issues) {

		var issue = issues[cardData.name],
				mustUpdate = false;

		// Update state if needed
		if (cardData.state !== issue.state) {
			mustUpdate = true;
		}

		// Update labels
		var stateLabelFound = false;
		for (var i = 0; i < issue.labels.length; i++) {
			// Don't update the category label, only the
			// label that represents the state.
			var currentIssueLabel = issue.labels[i];
			if (currentIssueLabel.name.toLowerCase() === cardData.label) {
				stateLabelFound = true;
			}
		}

		if (!stateLabelFound) {
			mustUpdate = true;
		}

		if (mustUpdate) {
			this.updateGithubIssue(cardData, issue);
		}

	} else if (cardData.state === 'open') {
		this.createGithubIssue(cardData);
	}

};

/**
 * @param {Object} cardData
 * @param {Object} issue
 * @method updateGithubIssue
 * @public
 */
TrelloGithub.prototype.updateGithubIssue = function(cardData, issue) {

	var labels = this.getLabelsForGithubIssue(cardData);

	this._githubAPI.issues.edit({
		user: config.github.user,
		repo: config.github.repo,
		title: cardData.name,
		labels: labels,
		number: issue.number,
		state: cardData.state
	}, function(err, issues) {
		if (err) {
			console.log('Error editing issue ' + cardData.name);
		} else {
			console.log('Edited issue ' + cardData.name + ' ' + cardData.category + ' ' + cardData.label);
		}
	});

};

/**
 * @param {Object} cardData
 * @method getLabelsForGithubIssue
 * @return {Array}
 * @public
 */
TrelloGithub.prototype.getLabelsForGithubIssue = function(cardData) {

	var labels = [cardData.label];
	if (cardData.category !== '') {
		labels.push(cardData.category);
	}

	return labels;

};

/**
 * @param {Object} cardData
 * @method createGithubIssue
 * @public
 */
TrelloGithub.prototype.createGithubIssue = function(cardData) {

	var labels = this.getLabelsForGithubIssue(cardData);

	// Create a new issue
	this._githubAPI.issues.create({
		user: config.github.user,
		repo: config.github.repo,
		title: cardData.name,
		labels: labels
	}, function(err, issues) {
		if (err) {
			console.log('Error creating issue ' + cardData.name);
		} else {
			console.log('Created new issue ' + cardData.name + ' ' + cardData.category + ' ' + cardData.label);
		}
	});

};

module.exports = TrelloGithub;
