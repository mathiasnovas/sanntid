#!/usr/bin/env node

var app = {
	init: function () {
		var args = app.getArgs();

		if (typeof args[0] === 'undefined') {
			return app.help();
		}

		app.search(args[0], args[1]);
	},

	search: function (query, direction) {
		var db = require('./db/stops2.json'),
			prompt = require('prompt'),
			reg = new RegExp(query, 'g'),
			hits = [];

		var hit = db.filter(function (item) {
			if (!isNaN(parseFloat(query)) && isFinite(query)) {
				if (item.id === query) {
					hits.push(item);
				}
			} else {
				if (item.name.toLowerCase().match(reg) || item.name.match(reg)) {
					hits.push(item);
				}
			}
		});

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
					console.log(hits[result.platform].name);
					app.getRealtimeData(hits[result.platform], direction);
				});

				return false;
			} else {
				app.getRealtimeData(hits[0], direction);
			}
		} else {
			app.error('The id/name was not found...');
		}
	},

	error: function (message) {
		return console.error(message);
	},

	help: function () {
		return console.info('Usage: sanntid.js <int>');
	},

	getArgs: function () {
		return [process.argv[2], process.argv[3]];
	},

	getRealtimeData: function (location, direction) {
		var request = require('request'),
			url = 'http://reisapi.ruter.no/stopvisit/getdepartures/' + location.id;

		request(url, {}, function (err, res, body) {
			if (!err && res.statusCode == 200) {
				app.data = app.parseData(JSON.parse(body), direction);
			} else {
				app.error('No data received from Ruter.');
			}
		});
	},

	parseData: function (data, direction) {
		var result = [],
			direction = (direction ? direction : false),
			moment = require('moment');

		for (var i = 0; i < 5; i++) {
			var visit = data[i];

			if (typeof visit.MonitoredVehicleJourney === 'undefined') {
				return false;
			}

			if (!direction || (direction && direction === visit.MonitoredVehicleJourney.DirectionRef)) {
				var timestamp = visit.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime,
					name = visit.MonitoredVehicleJourney.DestinationName,
					line = visit.MonitoredVehicleJourney.PublishedLineName,
					vehicle = visit.MonitoredVehicleJourney.VehicleMode,
					atStop = (visit.MonitoredVehicleJourney.MonitoredCall.VehicleAtStop ? '🚦' : '➟'),
					occupancy = visit.Extensions.OccupancyData.OccupancyPercentage,
					time = moment(timestamp).fromNow();

				switch (vehicle) {
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

				result.push(vehicle + '  ' + line + ' ' + name + ' - ' + time);
			}
		}

		app.output(result);
	},

	output: function (data) {
		console.log(data.join('\n'));
	}
}

app.init();
