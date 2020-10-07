/* Magic Mirror
 * Module: mrx-work-traffic
 *
 * By Dominic Marx
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const request = require("request");
const moment = require("moment");
const fs = require("fs");

module.exports = NodeHelper.create({
	start: function () {
		console.log("====================== Starting node_helper for module [" + this.name + "]");
		this.loadFile();
		this.isRunning = false;
	},

        commuteFile: `${__dirname}/public/commuteData.json`,

	loadFile: function () {
            if (!fs.existsSync(this.commuteFile)) {
                console.log("Commute file not found! Will create a new one.");
                this.commuteData = {};
            } else {
                var jsonData = fs.readFileSync(this.commuteFile, "utf8");
                this.commuteData = JSON.parse(jsonData);
		for (var route in this.commuteData) {
			if (!this.commuteData[route].hasOwnProperty("time")) {
				console.log("Converting old data...");
				var old = this.commuteData[route];
				this.commuteData[route] = {}
				this.commuteData[route].time = 0;
				this.commuteData[route].data = [];
				for (var i = 0; i < old.length; i++) {
					this.commuteData[route].data.push([
						moment(old[i][1], "HH:mm").format("X"),
						old[i][2]
					]);
				}
			}
		}
                console.log(JSON.stringify(this.commuteData));
                console.log("Successfully loaded commute List!");

            }
        },

	// subclass socketNotificationReceived
	socketNotificationReceived: function (notification, payload) {
		if (notification === "GOOGLE_TRAFFIC_GET") {
			this.moduleData = payload;
			this.getPredictions();
			if (!this.isRunning) {
				console.log("MMM-MyCommute starting poll cycle...");
				this.isRunning = true;
				var self = this;
				var gtInterval = setInterval( function() {
					self.getPredictions()
				}, self.moduleData.config.pollFrequency);
			} else {
				console.log("MMM-MyCommute poll cycle already running");
			}
		}
	},

	getPredictions: function() {
		console.log("Getting traffic predictions...");
		var payload = this.moduleData;
		const self = this;
		let returned = 0;
		const predictions = [];
		payload.destinations.forEach(function (dest, index) {
			console.log("MMM-MyCommute fetching destination " + dest.config.label);
			request({url: dest.url, method: "GET"}, function (error, response, body) {
				const prediction = new Object({
					config: dest.config
				});

				if (!error && response.statusCode === 200) {
					const data = JSON.parse(body);
					if (data.error_message) {
						console.log("MMM-MyCommute: " + data.error_message);
						prediction.error = true;
						prediction.error_msg = data.error_message;
					} else if (data.status !== "OK") {
						console.log("MMM-MyCommute: " + data.status);
						console.debug(data);
						prediction.error = true;
						prediction.error_msg = "data.status != OK: " + data.status;
					} else {
						const routeList = [];
						for (let i = 0; i < data.routes.length; i++) {
							const r = data.routes[i];
							const routeObj = new Object({
								summary: r.summary,
								time: r.legs[0].duration.value
							});

							if (r.legs[0].duration_in_traffic) {
								routeObj.timeInTraffic = r.legs[0].duration_in_traffic.value;
							}
							if (dest.config.mode && dest.config.mode === "transit") {
								const transitInfo = [];
								let gotFirstTransitLeg = false;
								for (let j = 0; j < r.legs[0].steps.length; j++) {
									const s = r.legs[0].steps[j];
									if (s.transit_details) {
										let arrivalTime = "";
										if (!gotFirstTransitLeg && dest.config.showNextVehicleDeparture) {
											gotFirstTransitLeg = true;
											arrivalTime = moment(s.transit_details.departure_time.value * 1000);
										}
										transitInfo.push({routeLabel: s.transit_details.line.short_name ? s.transit_details.line.short_name : s.transit_details.line.name, vehicle: s.transit_details.line.vehicle.type, arrivalTime: arrivalTime});
									}
								}
								routeObj.transitInfo = transitInfo;
								if (transitInfo.length <= 0) {
									const travelModes = r.legs[0].steps.map(s => s.travel_mode).join(", ");
									console.log("MMM-MyCommute: transit directrions does not contain any transits (" + travelModes + ")");
									prediction.error = true;
									prediction.error_msg = "MMM-MyCommute: transit directrions does not contain any transits (" + travelModes + ")";
								}
							}
							routeList.push(routeObj);
						}
						prediction.routes = routeList;
					}
				} else {
					prediction.error = true;
					if (response !== undefined) {
						console.log("Error getting traffic prediction: " + response.statusCode);
						prediction.error_msg = "Error getting traffic prediction: " + response.statusCode;
					} else {
						console.log("Error getting traffic prediction: " + error);
						prediction.error_msg = "Error getting traffic prediction: " + error;
					}
				}
				predictions[index] = prediction;
				returned++;


				console.log(JSON.stringify(prediction));
				console.log(prediction.config.label);
				if (!prediction.error_msg && prediction.config) {
					if (!self.commuteData[prediction.config.label]) {
						self.commuteData[prediction.config.label] = {
							time: 0,
							data: []
						}
					}
					var timeInTraffic = prediction.routes[0].timeInTraffic || prediction.routes[0].time;
					self.commuteData[prediction.config.label].time = prediction.routes[0].time;
					self.commuteData[prediction.config.label].data.push([
						//moment().format('dd'), 
						//moment().format('HH:mm'), 
						moment().format('X'),
						timeInTraffic
					]);
				}

				if (returned === payload.destinations.length) {
					console.log("MMM-MyCommute sending Socket Notification!");
					self.sendSocketNotification("GOOGLE_TRAFFIC_RESPONSE" + payload.instanceId, { predictions: predictions, commuteData: self.commuteData });
					//console.log(JSON.stringify(self.commuteData));
					fs.writeFile(self.commuteFile, JSON.stringify(self.commuteData), (err) => {
						if (err) throw err;
						console.log("Commute data file has been saved!");
					});
				}

			});
		});
	}
});
