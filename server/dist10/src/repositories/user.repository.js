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
const models_1 = require("../models");
const datasources_1 = require("../datasources");
const core_1 = require("@loopback/core");
const config_1 = require("../config");
const Nexmo = require('nexmo');
let UserRepository = class UserRepository extends repository_1.DefaultCrudRepository {
    constructor(dataSource) {
        super(models_1.User, dataSource);
        // Configure the Nexmo services
        this.nexmo = new Nexmo({ apiKey: process.env.NEXMO_API_KEY, apiSecret: process.env.NEXMO_API_SECRET }, { debug: true });
    }
    // Create a new PIN Code for a User
    create2FARequestForUser(user) {
        return new Promise(async (resolve, reject) => {
            // Start a 2FA session with Nexmo
            this.nexmo.verify.request({ number: user.phoneNumber, brand: config_1.Config.nexmo2FA.brand }, async (err, response) => {
                if (err) {
                    console.log('GOT AN ERROR DURING 2FA REQUEST');
                    console.log(err);
                    resolve('ERROR');
                }
                else {
                    if (response.error_text && response.error_text.length > 0) {
                        console.log('NEXMO 2FA CREATE - ' + response.error_text);
                    }
                    switch (response.status) {
                        case '0': // Success
                            let requestID = response.request_id;
                            user.key2FA = config_1.Config.nexmo2FA.keyPrefix + requestID;
                            await this.updateById(user.userID, user);
                            resolve('SUCCESS');
                            break;
                        case '1': // Throttled, please wait
                        case '5': // Internal Error, please wait
                        case '9': // Payment account balance is 0, please wait
                            resolve('WAIT');
                            break;
                        case '7': // Phone number is blacklisted, use different phone
                        case '15': // Phone number is not on supported network, use different phone
                            resolve('DIFFERENT_PHONE');
                            break;
                        case '16': // Bad PIN code, try again
                            resolve('TRY_AGAIN');
                            break;
                        case '6': // 2FA request must be recreated
                        case '10': // Must complete pending 2FA request or recreate it
                        case '17': // Too many bad PIN codes, must be recreated
                        case '101': // 2FA request is invalid, and must be recreated
                            resolve('RECREATE_PIN');
                            break;
                        default:
                            resolve('ERROR');
                            break;
                    }
                }
            });
        });
    }
    verify2FARequestForUser(user, verificationCode) {
        return new Promise(async (resolve, reject) => {
            // Get the current 2FA requestID for this user
            let requestID = (!user.key2FA) ? '' : ((user.key2FA.indexOf(config_1.Config.nexmo2FA.keyPrefix) == 0) ? user.key2FA.substr(config_1.Config.nexmo2FA.keyPrefix.length) : '');
            if (requestID.trim().length > 0) {
                // Check the 2FA login
                this.nexmo.verify.check({ request_id: requestID, code: verificationCode }, async (err, response) => {
                    if (err) {
                        console.log('GOT AN ERROR DURING 2FA CHECKING');
                        console.log(err);
                        resolve('ERROR');
                    }
                    else {
                        if (response.error_text && response.error_text.length > 0) {
                            console.log('NEXMO 2FA VERIFY - ' + response.error_text);
                        }
                        switch (response.status) {
                            case '0': // Success
                                user.key2FA = undefined;
                                await this.updateById(user.userID, user);
                                resolve('SUCCESS');
                                break;
                            case '1': // Throttled, please wait
                            case '5': // Internal Error, please wait
                            case '9': // Payment account balance is 0, please wait
                                resolve('WAIT');
                                break;
                            case '7': // Phone number is blacklisted, use different phone
                            case '15': // Phone number is not on supported network, use different phone
                                resolve('DIFFERENT_PHONE');
                                break;
                            case '16': // Bad PIN code, try again
                                resolve('TRY_AGAIN');
                                break;
                            case '6': // 2FA request must be recreated
                            case '10': // Must complete pending 2FA request or recreate it
                            case '17': // Too many bad PIN codes, must be recreated
                            case '101': // 2FA request is invalid, and must be recreated
                                resolve('RECREATE_PIN');
                                break;
                            default:
                                resolve('ERROR');
                                break;
                        }
                    }
                });
            }
            else {
                resolve('RECREATE_PIN');
            }
        });
    }
    cancelPending2FARequestForUser(user) {
        return new Promise(async (resolve, reject) => {
            // Get the current 2FA requestID for this user
            let requestID = (!user.key2FA) ? '' : ((user.key2FA.indexOf(config_1.Config.nexmo2FA.keyPrefix) == 0) ? user.key2FA.substr(config_1.Config.nexmo2FA.keyPrefix.length) : '');
            if (requestID.trim().length > 0) {
                // Check the status of the existing 2FA requestID
                this.nexmo.verify.search(requestID, async (searchError, searchResponse) => {
                    if (searchError) {
                        console.log('GOT AN ERROR DURING 2FA SEARCHING');
                        console.log(searchError);
                        resolve('ERROR');
                    }
                    else {
                        if (searchResponse.error_text && searchResponse.error_text.length > 0) {
                            console.log('NEXMO 2FA SEARCH - ' + searchResponse.error_text);
                        }
                        switch (searchResponse.status) {
                            case 'IN PROGRESS':
                                let cancelStatus = await this.cancelSpecific2FARequest(requestID);
                                if (cancelStatus == 'SUCCESS' || cancelStatus == 'ERROR') {
                                    resolve(cancelStatus);
                                }
                                if (cancelStatus == 'WAIT') {
                                    setTimeout(async () => {
                                        let delayedCancelStatus = await this.cancelSpecific2FARequest(requestID);
                                        if (delayedCancelStatus == 'SUCCESS' || delayedCancelStatus == 'ERROR') {
                                            resolve(delayedCancelStatus);
                                        }
                                        if (delayedCancelStatus == 'WAIT') {
                                            resolve('ERROR');
                                        }
                                    }, 30000);
                                }
                                break;
                            case 'SUCCESS':
                            case 'FAILED':
                            case 'EXPIRED':
                            case 'CANCELLED':
                            case '101':
                            default:
                                resolve('SUCCESS');
                                break;
                        }
                    }
                });
            }
            else {
                resolve('SUCCESS');
            }
        });
    }
    cancelSpecific2FARequest(requestID) {
        return new Promise(async (resolve, reject) => {
            if (requestID.trim().length > 0) {
                this.nexmo.verify.control({ request_id: requestID, cmd: 'cancel' }, (cancelError, cancelResponse) => {
                    if (cancelResponse.error_text && cancelResponse.error_text.length > 0) {
                        console.log('NEXMO 2FA CANCEL - ' + cancelResponse.error_text);
                    }
                    if (cancelError) {
                        console.log('GOT AN ERROR DURING 2FA CANCELLING');
                        console.log(cancelError);
                        resolve('ERROR');
                    }
                    else {
                        switch (cancelResponse.status.toString()) {
                            case '0': // Success
                                resolve('SUCCESS');
                                break;
                            case '19': // Cannot cancel request right now
                                resolve('WAIT');
                                break;
                            default:
                                resolve('ERROR');
                                break;
                        }
                    }
                });
            }
            else {
                resolve('SUCCESS');
            }
        });
    }
};
UserRepository = __decorate([
    __param(0, core_1.inject('datasources.cloudant')),
    __metadata("design:paramtypes", [datasources_1.CloudantDataSource])
], UserRepository);
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map