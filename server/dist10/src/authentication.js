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
const context_1 = require("@loopback/context");
const authentication_1 = require("@loopback/authentication");
const repository_1 = require("@loopback/repository");
const passport_http_1 = require("passport-http");
const passport_jwt_1 = require("passport-jwt");
const repositories_1 = require("./repositories");
const config_1 = require("./config");
const CustomStrategy = require('passport-custom').Strategy;
const uuid62 = require('uuid62');
const Nexmo = require('nexmo');
let AuthStrategyProvider = class AuthStrategyProvider {
    constructor(metadata, userRepository, loginAttemptRepository, readOnlyUserRepository) {
        this.metadata = metadata;
        this.userRepository = userRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.readOnlyUserRepository = readOnlyUserRepository;
        this.USING_2FA = (process.env.USING_2FA && process.env.USING_2FA == 'false') ? false : true;
        // Configure the Nexmo services
        this.nexmo = new Nexmo({ apiKey: process.env.NEXMO_API_KEY, apiSecret: process.env.NEXMO_API_SECRET }, { debug: true });
    }
    value() {
        // The function was not decorated, so we shouldn't attempt authentication
        if (!this.metadata) {
            return undefined;
        }
        const name = this.metadata.strategy;
        if (name === 'BasicStrategy') {
            return new passport_http_1.BasicStrategy(this.verifyEmailPass.bind(this));
        }
        else if (name === 'LimitedStrategy') {
            return new CustomStrategy(this.verifyCustom.bind(this));
        }
        else if (name === 'JWTStrategy') {
            let options = {
                secretOrKey: config_1.Config.jwt.encryptingKey,
                jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                issuer: config_1.Config.jwt.issuer,
                audience: config_1.Config.jwt.audience,
                algorithms: [config_1.Config.jwt.algorithm],
                ignoreExpiration: false,
                passReqToCallback: false
            };
            return new passport_jwt_1.Strategy(options, this.verifyJWT.bind(this));
        }
        else {
            return Promise.reject(`The strategy ${name} is not available.`);
        }
    }
    async verifyEmailPass(email, password, cb) {
        // Verify email and password were provided
        if (email.length == 0) {
            console.log('SKYCARE BASIC AUTH - Email is a required argument');
            cb(null, false);
            return;
        }
        if (password.length == 0) {
            console.log('SKYCARE BASIC AUTH - Password is a required argument');
            cb(null, false);
            return;
        }
        // find user by name & password
        this.userRepository.findOne({ where: { email: email.toLowerCase() } }).then(async (user) => {
            if (!user) {
                // user not found
                console.log('SKYCARE BASIC AUTH - Email does not exist');
                cb(null, false);
            }
            else {
                // Check LoginAttempts for 5 failed logins in 24 hours
                let loginAttemptFilter = {
                    where: { email: email.toLowerCase() },
                    limit: 5
                };
                let loginAttempts = await this.loginAttemptRepository.find(loginAttemptFilter);
                let rightNow = Date.now();
                let oneDayAgo = rightNow - (24 * 60 * 60 * 1000);
                let tooManyLoginAttempts = loginAttempts.every((value, index, array) => {
                    return (Date.parse(value.loginDate) > oneDayAgo);
                });
                // If we have crossed this threshold, then respond with an error
                if (tooManyLoginAttempts && loginAttempts.length == 5) {
                    console.log('SKYCARE BASIC AUTH - Exceeded 5 failed logins in a 24-hour period');
                    cb(null, false);
                }
                else {
                    if (user.password !== password) {
                        let failedLoginAttempt = {
                            email: email.toLowerCase(),
                            loginDate: (new Date()).toISOString(),
                            loginAttemptID: uuid62.v4()
                        };
                        await this.loginAttemptRepository.create(failedLoginAttempt);
                        console.log('SKYCARE BASIC AUTH - Password is incorrect');
                        cb(null, false);
                    }
                    else {
                        if (this.USING_2FA) {
                            // Cancel any pending 2FA requests for this user
                            let cancelSuccess = await this.userRepository.cancelPending2FARequestForUser(user);
                            if (cancelSuccess != 'SUCCESS') {
                                cb(new Error('Failed to cancel a pending 2FA request for the User'), false);
                                return;
                            }
                            // Create the new 2FA request for this user
                            let createSuccess = await this.userRepository.create2FARequestForUser(user);
                            if (createSuccess != 'SUCCESS') {
                                cb(new Error('Failed to create a new 2FA request for the User'), false);
                                return;
                            }
                        }
                        // Return the UserProfile for this User
                        cb(null, {
                            id: user.userID,
                            name: user.name,
                            email: user.email.toLowerCase(),
                            role: user.role,
                            using2FA: (user.phoneNumber.length > 0 && this.USING_2FA)
                        });
                    }
                }
            }
        });
    }
    async verifyCustom(req, cb) {
        console.log('debug');
        const customToken = req.url.substring(req.url.lastIndexOf('/') + 1);
        try {
            // Try to retrieve the ReadOnlyUser in the database
            let savedReadyOnlyUser = await this.readOnlyUserRepository.findById(customToken);
            // Create a fake UserProfile for this User
            cb(null, {
                id: customToken,
                name: 'Limited User',
                email: 'limited@skycareglobal.com',
                role: 'limited',
                caseID: savedReadyOnlyUser.caseID,
                using2FA: false
            });
        }
        catch (err) {
            console.log('SKYCARE CUSTOM AUTH - Provided access token is not valid');
            cb(null, false);
        }
    }
    verifyJWT(jwtPayload, cb) {
        if (jwtPayload.role == 'limited') {
            // Create a fake UserProfile for this User
            cb(null, {
                id: jwtPayload.sub,
                name: jwtPayload.name,
                email: jwtPayload.email,
                role: jwtPayload.role,
                caseID: jwtPayload.caseID,
                using2FA: false
            });
        }
        else {
            // find user by name & password
            this.userRepository.findOne({ where: { userID: jwtPayload.sub } }).then((user) => {
                if (!user) {
                    // call cb(null, false) when user not found
                    cb(null, false);
                }
                else {
                    // call cb(null, user) when user is authenticated
                    cb(null, {
                        id: user.userID,
                        name: user.name,
                        email: user.email.toLowerCase(),
                        role: user.role,
                        using2FA: (user.phoneNumber.length > 0 && this.USING_2FA)
                    });
                }
            });
        }
    }
};
AuthStrategyProvider = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.METADATA)),
    __param(1, repository_1.repository(repositories_1.UserRepository)),
    __param(2, repository_1.repository(repositories_1.LoginAttemptRepository)),
    __param(3, repository_1.repository(repositories_1.ReadOnlyUserRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.UserRepository,
        repositories_1.LoginAttemptRepository,
        repositories_1.ReadOnlyUserRepository])
], AuthStrategyProvider);
exports.AuthStrategyProvider = AuthStrategyProvider;
//# sourceMappingURL=authentication.js.map