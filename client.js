#!/usr/bin/env node

/**
 * Read tasks from a trello dashboard and store them as issues in a github repository,
 * updating state changes.
 *
 * @author Tomas Perez <tom@0x101.com>
 */
var config = require('node-config').get('config'),
		log = require('node-log');
