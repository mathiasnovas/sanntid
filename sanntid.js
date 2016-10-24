#!/usr/bin/env node

var app = {
	/**
	 * Initialize the script.
	 */
	init: function () {
		var prompt = require('prompt'),
			program = require('commander'),
			packageData = require('./package.json'),
			args = app.getArgs(),
			direction,
			results,
			hits;

		program
			.version(packageData.version)
			.usage('[options] <location> [<direction>]')
			.option('-n, --results <n>', 'Amount of results to show', parseInt)
			.parse(process.argv);

		if (typeof program.args[0] === 'undefined') {
			return program.help();
		}

		hits = app.search(program.args[0]);
		direction = program.args[1];
		results = program.results ? program.results : 5;

		if (hits.length > 0) {
			if (hits.length > 1) {
				for (var i = 0; i < hits.length; i++) {
					console.log(i + ': ' + hits[i].name);
				}

				var schema = {
					properties: {
						platform: {
							pattern: /^[0-9]+$/,
							description: 'Select platform',
							message: 'Platform ID must be a number',
							required: true,
							default: 0
						}
					}
				}

				prompt.start();

				prompt.get(schema, function (err, result) {
					console.log(hits[result.platform].name + ' - ' + hits[result.platform].id);
					app.getRealtimeData(hits[result.platform], direction, results, app.output);
				});

				return false;
			} else {
				app.getRealtimeData(hits[0], direction, results, app.output);
			}
		} else {
			app.error('The id/name was not found...');
		}
	},

	/**
	 * List all of the available stops.
	 *
	 * @return {Array}
	 */
	list: function () {
		return require('./db/stops.json');
	},

	/**
	 * Search for locations.
	 *
	 * @param {String} query Location to search for (ID or text)
	 * @return {Array}
	 */
	search: function (query) {
		var db = app.list(),
			reg = new RegExp(query, 'g'),
			hits = [];

		var hit = db.filter(function (item) {
			if (!isNaN(parseFloat(query)) && isFinite(query)) {
				query = parseInt(query);

				if (item.id === query) {
					hits.push(item);
				}
			} else {
				if (item.name.toLowerCase().match(reg) || item.name.match(reg)) {
					hits.push(item);
				}
			}
		});

		return hits;
	},

	/**
	 * Output an error message.
	 */
	error: function (message) {
		return console.error(message);
	},

	/**
	 * Extract the process arguments.
	 *
	 * @return {Array}
	 */
	getArgs: function () {
		return [process.argv[2], process.argv[3]];
	},

	/**
	 * Fetch realtime data from the Ruter API.
	 *
	 * @param {Object}   location  Location to fetch data for
	 * @param {Number}   direction (Optional) Direction to limit the data to
	 * @param {Number}   results   (Optional) Desured amount of results
	 * @param {Function} callback  Function to send the results to
	 */
	getRealtimeData: function (location, direction, results, callback) {
		var request = require('request'),
			url = 'http://reisapi.ruter.no/stopvisit/getdepartures/' + location.id,
			data;

		if (typeof callback === 'undefined') {
			callback = direction;
			direction = false;
		}

		request(url, {}, function (err, res, body) {
			if (!err && res.statusCode == 200) {
				data = app.parseData(JSON.parse(body), direction, results);
				callback(data);
			} else {
				app.error('No data received from Ruter.');
			}
		});
	},

	/**
	 * Parse the data from the Ruter API.
	 *
	 * @param {Array}  data      Data from the API
	 * @param {Number} direction (Optional) Direction to limit the data to
	 * @param {Number} results   (Optional) Desured amount of results
	 * @return {Array}
	 */
	parseData: function (data, direction, results) {
		var result = [],
			direction = (direction ? direction : false),
			moment = require('moment'),
			count = 0;

		if (!results) {
			results = data.length;
		}

		for (var i = 0; i < data.length; i++) {
			var visit = data[i];

			if (typeof visit === 'undefined') {
				continue;
			} else if (count === results) {
				break;
			}

			if (!direction || (direction && direction === visit.MonitoredVehicleJourney.DirectionRef)) {
				var timestamp = visit.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime,
					now = new Date(),
					timestamp = new Date(timestamp),
					arrival = timestamp.getHours() + ':' + timestamp.getMinutes();

				if ((timestamp.getMinutes() - now.getMinutes()) < 10) {
					arrival = moment(timestamp).fromNow();
				}

				result.push({
					timestamp: timestamp,
					name: visit.MonitoredVehicleJourney.DestinationName,
					direction: visit.MonitoredVehicleJourney.DirectionName,
					line: visit.MonitoredVehicleJourney.PublishedLineName,
					vehicle: visit.MonitoredVehicleJourney.VehicleMode,
					atStop: (visit.MonitoredVehicleJourney.MonitoredCall.VehicleAtStop ? true : false),
					occupancy: visit.Extensions.OccupancyData ? visit.Extensions.OccupancyData.OccupancyPercentage : 0,
					time: arrival
				});

				count++;
			}
		}

		return result;
	},

	/**
	 * Output data.
	 */
	output: function (data) {
		console.log(data.map(function (item) {
			var vehicle;

			switch (item.vehicle) {
				case 0:
					vehicle = '🚌';
					break;
				case 3:
					vehicle = '🚋';
					break;
				case 4:
					vehicle = '🚈';
					break;
				default:
					vehicle = '🚌';
			}

			return vehicle + '  ' + item.line + ' \t ' + item.name + ' - ' + item.time;
		}).join('\n'));
	}
}

if (!module.parent) {
    app.init();
} else {
    exports.search = app.search;
    exports.list = app.list;
    exports.getRealtimeData = app.getRealtimeData;
}
