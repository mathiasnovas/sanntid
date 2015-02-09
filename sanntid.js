#!/usr/bin/env node

var app = {
	init: function () {
		var args = app.getArgs();

		if (typeof args[0] === 'undefined') {
			return app.help();
		}

		app.getRealtimeData(args[0], args[1]);
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
			url = 'http://reisapi.ruter.no/stopvisit/getdepartures/' + location;

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

			if (!direction || (direction && direction === visit.MonitoredVehicleJourney.DirectionRef)) {
				var timestamp = visit.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime,
					name = visit.MonitoredVehicleJourney.DestinationName,
					line = visit.MonitoredVehicleJourney.PublishedLineName,
					vehicle = (visit.MonitoredVehicleJourney.VehicleMode === 0 ? '🚌' : '🚋'),
					atStop = (visit.MonitoredVehicleJourney.MonitoredCall.VehicleAtStop ? '🚦' : '➟'),
					occupancy = visit.Extensions.OccupancyData.OccupancyPercentage;

				var time = moment(timestamp);

				result.push(vehicle + '  ' + line + ' ' + name + ' - ' + time.fromNow());
			}
		}

		app.output(result);
	},

	output: function (data) {
		console.log(data.join('\n'));
	}
}

app.init();
