"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const context_1 = require("@loopback/context");
const authentication_1 = require("@loopback/authentication");
const request = require("request-promise-native");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const jwt_simple_1 = require("jwt-simple");
const config_1 = require("../config");
const cloudant = require("@cloudant/cloudant");
// @ts-ignore
const config = require("../datasources/cloudant.datasource.json");
let EscortsController = class EscortsController {
    constructor(user, dsConfig = config, escortRepository, userRepository, companyCaseRepository) {
        this.user = user;
        this.dsConfig = dsConfig;
        this.escortRepository = escortRepository;
        this.userRepository = userRepository;
        this.companyCaseRepository = companyCaseRepository;
    }
    async find(filter) {
        let escorts = await this.escortRepository.find(filter);
        if (escorts.length == 0) {
            return escorts;
        }
        let userCriteria = escorts.map((v, i, l) => { return { userID: v.userID }; });
        let userFilter = { where: { or: userCriteria } };
        let users = await this.userRepository.find(userFilter);
        for (let ix = 0; ix < escorts.length; ix++) {
            let userIndex = users.findIndex((v, i, l) => { return v.userID == escorts[ix].userID; });
            if (userIndex > -1) {
                escorts[ix].user = users[userIndex];
                //@ts-ignore
                escorts[ix].user.password = '';
                //@ts-ignore
                escorts[ix].user.key2FA = '';
            }
        }
        return escorts;
    }
    async updateById(escortID, escort) {
        // Update the Escort Profile by its ID
        await this.escortRepository.updateById(escortID, escort);
        // Get the User record from the database for the current User
        let currentUser = await this.userRepository.findById(this.user.id);
        // Update the User record with the same name that was provided as part of the Escort Profile
        currentUser.name = escort.name;
        // Update the User record in the database
        await this.userRepository.updateById(currentUser.userID, currentUser);
        return true;
    }
    async addEscortTrackingLocation(credentials, escortID, escortLocation, response) {
        response.setTimeout(600 * 1000);
        try {
            // Decode the JWT so we know the current user role
            let jwt = credentials.substr(credentials.indexOf(' ') + 1);
            let token = jwt_simple_1.decode(jwt, config_1.Config.jwt.encryptingKey, false, config_1.Config.jwt.algorithm);
            // Connect to the Cloudant manually
            let cloudantConnection = cloudant(this.dsConfig);
            // Query the 'skycare' database, viewing the 'cases' design document for those that are 'activelyTrackingEscorts'
            let queryResponse = await cloudantConnection.use('skycare').view('cases', 'activelyTrackingEscorts');
            if (queryResponse.total_rows > 0) {
                // Extract the current Escort from the response      
                let escorts = queryResponse.rows.filter((v, i, l) => { return v.key.includes('ESCORT'); })
                    .map((vx, ix, lx) => { let escort = vx.value; escort.escortID = vx.value._id; return escort; })
                    .filter((vxx, ixx, lxx) => { return (vxx.userID == token.sub); });
                // Exit now if there are no Escorts for the current User
                if (escorts.length == 0) {
                    console.log('ERROR: The current Escort was not located in the active Cases needing Escort tracking');
                    return true;
                }
                // Exit now if the first Escort does not match the provided escortID (Escort can only track their own location)
                let currentEscort = escorts[0];
                if (currentEscort.escortID != escortID) {
                    console.log('ERROR: How did this happen?  Filtered user Escort does not match the Escort being tracked.');
                    console.log('ERROR METADATA: ' + escorts.length + ' - ' + escortID + ' - ' + currentEscort.escortID);
                    return true;
                }
                // Extract the CompanyCases from the response
                let companyCases = queryResponse.rows.filter((v, i, l) => { return v.key.includes('CASE'); })
                    .map((vx, ix, lx) => { return vx.value; })
                    .filter((vxx, ixx, lxx) => { return vxx.escorts.some((vxxx, ixxx, lxxx) => { return vxxx.escortID == escortID; }); });
                // Exit now if there are no Cases for the current Escort that need to be actively tracked
                if (companyCases.length == 0) {
                    console.log('WARN: No currently active Cases, so no escort tracking needed');
                    return true;
                }
                // Record the Escort tracking info in each of the Cases that were located
                for (let i = 0; i < companyCases.length; i++) {
                    let stage = this.determineTrackingStage(companyCases[i]);
                    console.log('INFO: CaseID - ' + companyCases[i].caseID + ' - Stage - ' + stage + ' - EscortLocationStage - ' + escortLocation.stage);
                    if (stage == '') {
                        continue;
                    } // Case is in a non-tracking stage
                    if (stage == 'flight' && escortLocation.stage == '') {
                        continue;
                    } // Escort is still on the ground, should be in the air
                    if ((stage == 'preflight' || stage == 'postflight') && (companyCases[i].escortTracking !== undefined &&
                        companyCases[i].escortTracking !== null &&
                        companyCases[i].escortTracking.length > 0)) {
                        // Get the last recorded location for the current stage
                        let sortedLocationsForStage = companyCases[i].escortTracking.filter((vx, ix, lx) => { return vx.stage == stage; })
                            .sort((a, b) => {
                            let aDate = Date.parse(a.date);
                            let bDate = Date.parse(b.date);
                            if (aDate < bDate) {
                                return -1;
                            }
                            else if (aDate > bDate) {
                                return 1;
                            }
                            else {
                                return 0;
                            }
                        });
                        console.log('INFO: Number of existing tracked locations - ' + sortedLocationsForStage.length);
                        if (sortedLocationsForStage.length > 0) {
                            let lastLocation = sortedLocationsForStage[sortedLocationsForStage.length - 1];
                            let lastLocationGPS = { latitude: lastLocation.latitude, longitude: lastLocation.longitude };
                            let currentLocationGPS = { latitude: escortLocation.latitude, longitude: escortLocation.longitude };
                            let distanceTravelled = this.calculateGPSDistance(lastLocationGPS, currentLocationGPS);
                            if (distanceTravelled < 0.5) {
                                console.log('INFO: Current Escort location is not 0.5km or greater from last location - ' + distanceTravelled);
                                continue;
                            } // Escort is on the ground, but they are not 0.5km from their last location
                        }
                    }
                    escortLocation.stage = stage;
                    if (companyCases[i].escortTracking === undefined || companyCases[i].escortTracking === null) {
                        companyCases[i].escortTracking = [];
                    }
                    companyCases[i].escortTracking.push(escortLocation);
                    // Update the database
                    console.log('INFO: Attempting to update the Case - ' + companyCases[i].caseID);
                    this.companyCaseRepository.updateById(companyCases[i].caseID, companyCases[i]).then(() => {
                        console.log('INFO: Updated the case in the database');
                    }).catch((err) => {
                        console.log('ERROR: Failed while attempting to update a case in the database');
                        console.log(err);
                    });
                }
            }
            else {
                console.log('WARN: The current Escort does not have any active Cases needed tracking');
            }
            return true;
        }
        catch (err) {
            console.log('ERROR: Failed to track an escorts location');
            console.log(err);
            return false;
        }
    }
    async getFlightTrackingCoordinates(flightNumber) {
        const FLIGHT_AWARE_URL = 'http://' + config_1.Config.flightaware.user + ':' + config_1.Config.flightaware.key + '@flightxml.flightaware.com/json/FlightXML2/GetLastTrack';
        const QUERY_STRING = '?ident=' + flightNumber;
        let options = { uri: FLIGHT_AWARE_URL + QUERY_STRING };
        try {
            const rawResult = await request.get(options);
            const result = JSON.parse(rawResult);
            if (result.error !== undefined && result.error !== null) {
                console.log('ERROR: Failed to retrieve a flight location');
                console.log(result.error);
                return { latitude: 0, longitude: 0 };
            }
            else if (result.GetLastTrackResult === undefined || result.GetLastTrackResult.data === undefined || result.GetLastTrackResult.data.length == 0) {
                console.log('No flight data was returned');
                return { latitude: 0, longitude: 0 };
            }
            else {
                let mostRecentTrackingLocation = result.GetLastTrackResult.data[result.GetLastTrackResult.data.length - 1];
                return {
                    latitude: parseFloat(mostRecentTrackingLocation.latitude),
                    longitude: parseFloat(mostRecentTrackingLocation.longitude)
                };
            }
        }
        catch (err) {
            console.log('ERROR: Failed to retrieve a flight location');
            console.log(err);
            return { latitude: 0, longitude: 0 };
        }
    }
    determineTrackingStage(currentCase) {
        switch (currentCase.currentStatus) {
            case 'Escort picked up patient on way to airport':
            case 'Airport check-in complete and awaiting departure':
                return 'preflight';
            case 'Boarded & departed origin city':
            case 'Arrived & waiting in connection airport 1':
            case 'Boarded & departed connection airport 1':
            case 'Arrived & waiting in connection airport 2':
            case 'Boarded & departed connection airport 2':
                return 'flight';
            case 'Escort & patient arrived destination city':
            case 'Escort & patient with ground transport to final destination':
                return 'postflight';
            default:
                return '';
        }
    }
    degreesToRadians(degrees) { return degrees * Math.PI / 180; }
    calculateGPSDistance(origin, dest) {
        const EARTH_RADIUS_KM = 6371;
        let latDiffRadians = this.degreesToRadians(dest.latitude - origin.latitude);
        let lonDiffRadians = this.degreesToRadians(dest.longitude - origin.longitude);
        let originLatitudeAsRadians = this.degreesToRadians(origin.latitude);
        let destLatitudeAsRadians = this.degreesToRadians(dest.latitude);
        var a = Math.sin(latDiffRadians / 2) * Math.sin(latDiffRadians / 2) +
            Math.sin(lonDiffRadians / 2) * Math.sin(lonDiffRadians / 2) *
                Math.cos(originLatitudeAsRadians) * Math.cos(destLatitudeAsRadians);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.floor(EARTH_RADIUS_KM * c);
    }
};
__decorate([
    rest_1.get('/escorts', {
        responses: {
            '200': {
                description: 'Array of Escort model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.Escort } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.Escort))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EscortsController.prototype, "find", null);
__decorate([
    rest_1.patch('/escorts/{escortID}', {
        responses: {
            '204': {
                description: 'Escort PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, models_1.Escort]),
    __metadata("design:returntype", Promise)
], EscortsController.prototype, "updateById", null);
__decorate([
    rest_1.post('/escorts/{escortID}/tracking', {
        responses: {
            '200': {
                description: 'Success / Failure indication',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.header.string('Authorization')),
    __param(1, rest_1.param.path.string('escortID')),
    __param(2, rest_1.requestBody()),
    __param(3, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.EscortLocation, Object]),
    __metadata("design:returntype", Promise)
], EscortsController.prototype, "addEscortTrackingLocation", null);
__decorate([
    rest_1.get('/flight/{flightNumber}/tracking', {
        responses: {
            '200': {
                description: 'Current coordinates for a flight',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.GPSPoint } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('flightNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EscortsController.prototype, "getFlightTrackingCoordinates", null);
EscortsController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, context_1.inject('datasources.config.cloudant', { optional: true })),
    __param(2, repository_1.repository(repositories_1.EscortRepository)),
    __param(3, repository_1.repository(repositories_1.UserRepository)),
    __param(4, repository_1.repository(repositories_1.CompanyCaseRepository)),
    __metadata("design:paramtypes", [Object, Object, repositories_1.EscortRepository,
        repositories_1.UserRepository,
        repositories_1.CompanyCaseRepository])
], EscortsController);
exports.EscortsController = EscortsController;
//# sourceMappingURL=escorts.controller.js.map