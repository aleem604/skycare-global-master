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
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const authentication_1 = require("@loopback/authentication");
const core_1 = require("@loopback/core");
const config_1 = require("../config");
const sendgrid = require('@sendgrid/mail');
let CaseMessagesController = class CaseMessagesController {
    constructor(user, caseMessageRepository, companyCaseRepository, companyRepository) {
        this.user = user;
        this.caseMessageRepository = caseMessageRepository;
        this.companyCaseRepository = companyCaseRepository;
        this.companyRepository = companyRepository;
    }
    async create(companyID, caseID, caseMessage) {
        try {
            if (caseMessage.caseID != caseID) {
                caseMessage.caseID = caseID;
            }
            if (this.user.name !== undefined && caseMessage.senderID != this.user.name) {
                caseMessage.senderID = this.user.name;
            }
            let savedCaseMessage = await this.caseMessageRepository.create(caseMessage);
            // Retrieve the existing Case from storage
            let currentCase = await this.companyCaseRepository.findById(caseID);
            // Need to notify the Client and the assigned Escorts that a message was added to this Case
            let assignedEmailAddress = [];
            // Lookup the Company associated with this Case
            let company = await this.companyRepository.findById(currentCase.companyID);
            if (company.emailForUpdates1 !== undefined && company.emailForUpdates1 != null) {
                assignedEmailAddress.push(company.emailForUpdates1);
            }
            if (company.emailForUpdates2 !== undefined && company.emailForUpdates2 != null) {
                assignedEmailAddress.push(company.emailForUpdates2);
            }
            if (company.emailForUpdates3 !== undefined && company.emailForUpdates3 != null) {
                assignedEmailAddress.push(company.emailForUpdates3);
            }
            // Add each Escort to the list of emails
            for (let x = 0; x < currentCase.escorts.length; x++) {
                if (currentCase.escorts[x].email !== undefined && currentCase.escorts[x].email !== null && currentCase.escorts[x].name !== caseMessage.senderID) {
                    // @ts-ignore
                    assignedEmailAddress.push(currentCase.escorts[x].email);
                }
            }
            // Add each external access email to the list of emails
            if (currentCase.externalAccessEmail1 !== undefined && currentCase.externalAccessEmail1 !== null && currentCase.externalAccessEmail1.trim().length > 0) {
                assignedEmailAddress.push(currentCase.externalAccessEmail1);
            }
            if (currentCase.externalAccessEmail2 !== undefined && currentCase.externalAccessEmail2 !== null && currentCase.externalAccessEmail2.trim().length > 0) {
                assignedEmailAddress.push(currentCase.externalAccessEmail2);
            }
            if (currentCase.externalAccessEmail3 !== undefined && currentCase.externalAccessEmail3 !== null && currentCase.externalAccessEmail3.trim().length > 0) {
                assignedEmailAddress.push(currentCase.externalAccessEmail3);
            }
            if (assignedEmailAddress.length > 0) {
                assignedEmailAddress = assignedEmailAddress.filter((v, i, l) => {
                    // @ts-ignore
                    return v.toLowerCase() != this.user.email.toLowerCase();
                });
                if (assignedEmailAddress.length > 0) {
                    // Send the notification email to all assigned members of this Case
                    this.sendNewCaseMessageEmail(currentCase.caseNumber, savedCaseMessage, assignedEmailAddress);
                }
                else {
                    console.log('WARN: Noone to send an email to for new CaseMessage');
                }
            }
            return savedCaseMessage;
        }
        catch (err) {
            console.log('ERROR: Failed to save a CaseMessage');
            console.log(JSON.stringify(err));
            throw err;
        }
    }
    async find(companyID, caseID, filter) {
        if (filter === undefined || filter == null) {
            filter = { where: { caseID: caseID } };
        }
        return await this.caseMessageRepository.find(filter);
    }
    sendNewCaseMessageEmail(caseNumber, newMessage, emailAddresses) {
        // Send an email to all participants on the Case
        for (let i = 0; i < emailAddresses.length; i++) {
            console.log('INFO: Sending CaseMessage to ' + emailAddresses[i].toLowerCase());
            const emailMessage = {
                to: emailAddresses[i].toLowerCase(),
                from: config_1.Config.email.newCaseMessage.fromEmail,
                templateId: config_1.Config.email.newCaseMessage.templateID,
                dynamic_template_data: {
                    CASE_ID: caseNumber,
                    MSG_SENDER: newMessage.senderID,
                    MESSAGE: newMessage.message
                }
            };
            sendgrid.send(emailMessage);
        }
    }
};
__decorate([
    rest_1.post('/companies/{companyID}/cases/{caseID}/messages', {
        responses: {
            '200': {
                description: 'CaseMessage model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseMessage } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CaseMessage]),
    __metadata("design:returntype", Promise)
], CaseMessagesController.prototype, "create", null);
__decorate([
    rest_1.get('//companies/{companyID}/cases/{caseID}/messages', {
        responses: {
            '200': {
                description: 'Array of CaseMessage model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CaseMessage } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CaseMessage))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CaseMessagesController.prototype, "find", null);
CaseMessagesController = __decorate([
    __param(0, core_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, repository_1.repository(repositories_1.CaseMessageRepository)),
    __param(2, repository_1.repository(repositories_1.CompanyCaseRepository)),
    __param(3, repository_1.repository(repositories_1.CompanyRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.CaseMessageRepository,
        repositories_1.CompanyCaseRepository,
        repositories_1.CompanyRepository])
], CaseMessagesController);
exports.CaseMessagesController = CaseMessagesController;
//# sourceMappingURL=case-messages.controller.js.map