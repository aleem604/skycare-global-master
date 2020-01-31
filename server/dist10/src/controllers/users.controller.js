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
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const config_1 = require("../config");
const jwt_simple_1 = require("jwt-simple");
const uuid62 = require('uuid62');
const sendgrid = require('@sendgrid/mail');
let UsersController = class UsersController {
    constructor(user, userRepository, loginAttemptRepository, credentialResetRepository, companyRepository, companyUserRepository, escortRepository) {
        this.user = user;
        this.userRepository = userRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.credentialResetRepository = credentialResetRepository;
        this.companyRepository = companyRepository;
        this.companyUserRepository = companyUserRepository;
        this.escortRepository = escortRepository;
        // Configure our API services
        sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    }
    async create(user) {
        // Make sure the requesting user is an Admin
        // Store the new User in the database
        let newUser = await this.userRepository.create(user);
        // Create the additional records needed for the CLIENT and ESCORT user types
        if (user.role == 'client') {
            // Create a new Company
            let company = new models_1.Company({
                companyID: uuid62.v4(),
                name: user.companyName,
                emailForInvoices: user.email
            });
            // Store the new Company in the database
            let newCompany = await this.companyRepository.create(company);
            // Create a new CompanyUser
            let companyUser = new models_1.CompanyUser({
                companyUserID: uuid62.v4(),
                companyID: company.companyID,
                userID: newUser.userID,
                lastLogin: (new Date()).toISOString()
            });
            // Store the new CompanyUser in the database
            let newCompanyUser = await this.companyUserRepository.create(companyUser);
        }
        else if (user.role == 'escort') {
            // Create a new Escort
            let escort = new models_1.Escort({
                escortID: uuid62.v4(),
                userID: user.userID,
                name: user.name
            });
            // Store the new Escort in the database
            let newEscort = await this.escortRepository.create(escort);
        }
        // Create a CredentialReset for the new User
        let credentialReset = new models_1.CredentialReset({
            email: newUser.email.toLowerCase(),
            credentialResetID: uuid62.v4(),
            userID: newUser.userID,
            timestamp: (new Date()).toISOString()
        });
        let newCredentialReset = await this.credentialResetRepository.create(credentialReset);
        // Send an email to the new User, inviting them to setup their account
        const emailMessage = {
            to: newUser.email.toLowerCase(),
            from: config_1.Config.email.newUserInvitation.fromEmail,
            templateId: config_1.Config.email.newUserInvitation.templateID,
            dynamic_template_data: {
                SETUP_USER_ACCOUNT_LINK: process.env.MAIN_URL + config_1.Config.email.newUserInvitation.linkBaseURL + newCredentialReset.credentialResetID
            }
        };
        sendgrid.send(emailMessage);
        newUser.password = '';
        newUser.key2FA = '';
        return newUser;
    }
    async login(credentials, rememberMe) {
        // Base64-decode the credentials into email:password
        let encodedEmailPass = credentials.substr(credentials.indexOf(' ') + 1);
        let decodedEmailPass = new Buffer(encodedEmailPass, 'base64').toString('utf8');
        let email = decodedEmailPass.split(':')[0].toLowerCase();
        let password = decodedEmailPass.split(':')[1];
        // Create a search clause for looking up the user in the database
        let countWhere = {
            email: email,
            password: password
        };
        let userCount = await this.userRepository.count(countWhere);
        // Success if the User was located
        return userCount.count > 0;
    }
    sendNew2FAPINCode() {
        return new Promise(async (resolve, reject) => {
            // Lookup the user in the database, using the ID resolved from the JWT
            let completeUser = await this.userRepository.findById(this.user.id);
            // Cancel any pending 2FA requests for this user
            let cancelSuccess = await this.userRepository.cancelPending2FARequestForUser(completeUser);
            if (cancelSuccess == 'ERROR') {
                resolve('ERROR');
            }
            // Create the new 2FA request for this user
            let createSuccess = await this.userRepository.create2FARequestForUser(completeUser);
            resolve(createSuccess);
        });
    }
    complete2FA(verificationCode) {
        return new Promise(async (resolve, reject) => {
            // Lookup the user in the database, using the ID resolved from the JWT
            let completeUser = await this.userRepository.findById(this.user.id);
            // Check the 2FA login
            let verifySuccess = await this.userRepository.verify2FARequestForUser(completeUser, verificationCode);
            resolve(verifySuccess);
        });
    }
    async beginCredentialReset(reset) {
        // Lookup the email address in the User table
        let userFilter = { where: { email: reset.email.toLowerCase() } };
        let discoveredUser = await this.userRepository.findOne(userFilter);
        // If we located a User, then populate the CredentialReset object
        if (discoveredUser) {
            reset.credentialResetID = uuid62.v4();
            reset.userID = discoveredUser.userID;
            reset.timestamp = (new Date()).toISOString();
            // Save the CredentialReset object
            let createdReset = await this.credentialResetRepository.create(reset);
            // Send the requesting User an email that will allow them to finish the CredentialReset process
            const emailMessage = {
                to: createdReset.email.toLowerCase(),
                from: config_1.Config.email.credentialReset.fromEmail,
                templateId: config_1.Config.email.credentialReset.templateID,
                dynamic_template_data: {
                    RESET_LINK: process.env.MAIN_URL + config_1.Config.email.credentialReset.linkBaseURL + createdReset.credentialResetID
                }
            };
            sendgrid.send(emailMessage);
            // Return a success indicator
            return true;
        }
        else {
            // If we did not locate a User, then return a failure indicator
            return false;
        }
    }
    finishCredentialReset(reset) {
        return new Promise(async (resolve, reject) => {
            // Lookup the credentialResetID to make sure we have a valid session
            let resetFilter = { where: { credentialResetID: reset.credentialResetID } };
            let discoveredReset = await this.credentialResetRepository.findOne(resetFilter);
            if (discoveredReset) {
                // If we found a valid session, lookup the User associated with it
                let userFilter = { where: { userID: discoveredReset.userID } };
                let user = await this.userRepository.findOne(userFilter);
                if (user) {
                    // Update the user with details from the CredentialReset
                    if (reset.newPassword) {
                        user.password = reset.newPassword;
                    }
                    if (reset.email) {
                        user.email = reset.email.toLowerCase();
                    }
                    if (reset.newPhoneNumber) {
                        user.phoneNumber = reset.newPhoneNumber;
                    }
                    // Store the updated User in the database
                    await this.userRepository.update(user);
                    // Delete the CredentialReset record for this User
                    await this.credentialResetRepository.deleteById(reset.credentialResetID);
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }
            else {
                resolve(false);
            }
        });
    }
    checkCredentialResetIsActive(resetID) {
        return new Promise(async (resolve, reject) => {
            // Lookup the credentialResetID to make sure we have a valid session
            let resetFilter = { where: { credentialResetID: resetID } };
            let discoveredReset = await this.credentialResetRepository.findOne(resetFilter);
            if (discoveredReset) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    }
    emailAddressAvailable(emailAddress, resetID, credentials) {
        return new Promise(async (resolve, reject) => {
            let authorizedUserID = '';
            if (credentials && credentials.trim().length > 0 && credentials.indexOf('Bearer null') == -1 && credentials !== 'Bearer') {
                // If they supplied the JWT , then we prefer this to determine the authorizedUserID
                if (credentials.indexOf('Bearer') == -1) {
                    console.log('EMAIL SEARCH ERROR - Credentials are provided, but they are missing Bearer');
                    resolve('ACCESS_DENIED');
                }
                else {
                    let jwt = credentials.substr(credentials.indexOf(' ') + 1);
                    try {
                        let token = jwt_simple_1.decode(jwt, config_1.Config.jwt.encryptingKey, false, config_1.Config.jwt.algorithm);
                        authorizedUserID = token.sub;
                    }
                    catch (err) {
                        console.log('EMAIL SEARCH ERROR - Invalid JWT : INNER ERROR = ' + err);
                        resolve('ACCESS_DENIED');
                    }
                }
            }
            else if (resetID && resetID.trim().length > 0) {
                // If they supplied a resetID, get the associated UserID from the CredentialReset table
                let resetUserSearch = { where: { credentialResetID: resetID } };
                let resetUser = await this.credentialResetRepository.findOne(resetUserSearch);
                // This is only a valid authorized user if we found this CredentialReset, and there is a valid userID associated with the CredentialReset
                if (resetUser && resetUser.userID) {
                    authorizedUserID = resetUser.userID;
                }
                else {
                    console.log('EMAIL SEARCH ERROR - Reset credential provides, but it is not associated with a UserID.  UserID = ' + ((resetUser) ? ((resetUser.userID) ? resetUser.userID : 'undefined') : 'resetUserUndefined'));
                    resolve('ACCESS_DENIED');
                }
            }
            else {
                console.log('EMAIL SEARCH ERROR - Neither Credentials or Reset ID were provided');
                resolve('ACCESS_DENIED');
            }
            // Create a search filter for email addresses with the provided email address
            let emailSearch = { where: { email: emailAddress.toLowerCase() } };
            let discoveredUsers = await this.userRepository.find(emailSearch);
            // Email address is available if there are no associated User, or only associated User is the authorizedUserID
            if (discoveredUsers.length == 0 || discoveredUsers[0].userID == authorizedUserID) {
                resolve('AVAILABLE');
            }
            else {
                console.log('EMAIL SEARCH ERROR - Another User, other than the current Authorized User, as this email.  AuthorizedUserID = ' + authorizedUserID + ', FirstDiscoveredUserID = ' + discoveredUsers[0].userID);
                resolve('NOT_AVAILABLE');
            }
        });
    }
    async findById(id) {
        return await this.userRepository.findById(id);
    }
    async updateById(id, user) {
        // Ensure the requesting user is permitted to do this operation
        // Throw errors if the userID's do not match
        if (this.user.id != id) {
            throw new rest_1.HttpErrors.Unauthorized('JWT User is not permitted to access this User data');
        }
        await this.userRepository.updateById(id, user);
    }
    async delete(usersToDelete) {
        let userIDs = usersToDelete.split(',');
        let userCriteria = userIDs.map((v, i, l) => { return { userID: v }; });
        let userWhere = { or: userCriteria };
        let users = await this.userRepository.find({ where: userWhere });
        let companyUserCriteria = users.filter((v, i, l) => { return v.role == 'client'; })
            .map((vx, ix, lx) => { return { userID: vx.userID }; });
        if (companyUserCriteria.length > 0) {
            let companyUserWhere = { or: companyUserCriteria };
            let deletedCompanyUsers = await this.companyUserRepository.deleteAll(companyUserWhere);
            console.log('Want to delete ' + companyUserCriteria.length + ' company users');
            console.log('Actually deleted ' + deletedCompanyUsers.count + ' company users');
        }
        let deletedUsers = await this.userRepository.deleteAll(userWhere);
        console.log('Want to delete ' + userCriteria.length + ' users');
        console.log('Actually deleted ' + deletedUsers.count + ' users');
    }
    ping() { return; }
};
__decorate([
    rest_1.post('/users', {
        responses: {
            '200': {
                description: 'User model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.User } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    rest_1.post('/login', {
        responses: {
            '200': {
                description: 'Login a user and return a JWT',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        }
    }),
    authentication_1.authenticate('BasicStrategy'),
    __param(0, rest_1.param.header.string('Authorization')),
    __param(1, rest_1.param.query.boolean('rememberMe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "login", null);
__decorate([
    rest_1.post('/sendNew2FAPINCode', {
        responses: {
            '200': {
                description: 'Send a new 2FA PIN code to the User so they can complete their login',
                content: { 'text/plain': { schema: { type: 'string' } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sendNew2FAPINCode", null);
__decorate([
    rest_1.post('/complete2FA/{verificationCode}', {
        responses: {
            '200': {
                description: 'Complete the 2FA process for a User login',
                content: { 'text/plain': { schema: { type: 'string' } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('verificationCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "complete2FA", null);
__decorate([
    rest_1.post('/beginCredentialReset', {
        responses: {
            '200': {
                description: 'Request email / password reset for a user',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        }
    }),
    __param(0, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.CredentialReset]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "beginCredentialReset", null);
__decorate([
    rest_1.post('/finishCredentialReset', {
        responses: {
            '200': {
                description: 'Reset the email / password for a user and return success / failure',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        }
    }),
    __param(0, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.CredentialReset]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "finishCredentialReset", null);
__decorate([
    rest_1.get('/finishCredentialReset/{resetID}', {
        responses: {
            '200': {
                description: 'Verify that a Reset Session is still active and return success / failure',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        }
    }),
    __param(0, rest_1.param.path.string('resetID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "checkCredentialResetIsActive", null);
__decorate([
    rest_1.get('/users', {
        responses: {
            '200': {
                description: 'Verify if an email address is available',
                content: { 'text/plain': { schema: { type: 'string' } } },
            },
        },
    }),
    __param(0, rest_1.param.query.string('email')),
    __param(1, rest_1.param.query.string('resetID')),
    __param(2, rest_1.param.header.string('Authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "emailAddressAvailable", null);
__decorate([
    rest_1.get('/users/{id}', {
        responses: {
            '200': {
                description: 'User model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.User } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    rest_1.patch('/users/{id}', {
        responses: {
            '204': {
                description: 'User PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('id')), __param(1, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, models_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateById", null);
__decorate([
    rest_1.del('/users', {
        responses: {
            '204': {
                description: 'User DELETE success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.query.string('usersToDelete')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
__decorate([
    rest_1.get('/ping', {
        responses: {
            '204': {
                description: 'User DELETE success',
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "ping", null);
UsersController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER, { optional: true })),
    __param(1, repository_1.repository(repositories_1.UserRepository)),
    __param(2, repository_1.repository(repositories_1.LoginAttemptRepository)),
    __param(3, repository_1.repository(repositories_1.CredentialResetRepository)),
    __param(4, repository_1.repository(repositories_1.CompanyRepository)),
    __param(5, repository_1.repository(repositories_1.CompanyUserRepository)),
    __param(6, repository_1.repository(repositories_1.EscortRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.UserRepository,
        repositories_1.LoginAttemptRepository,
        repositories_1.CredentialResetRepository,
        repositories_1.CompanyRepository,
        repositories_1.CompanyUserRepository,
        repositories_1.EscortRepository])
], UsersController);
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map