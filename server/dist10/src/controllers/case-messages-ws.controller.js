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
const websocket_decorator_1 = require("../decorators/websocket.decorator");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const repository_1 = require("@loopback/repository");
const config_1 = require("../config");
const sendgrid = require('@sendgrid/mail');
let CaseMessagesWSController = class CaseMessagesWSController {
    // Equivalent to `@inject('ws.socket')`
    constructor(socket, caseMessageRepository, companyCaseRepository, companyRepository) {
        this.socket = socket;
        this.caseMessageRepository = caseMessageRepository;
        this.companyCaseRepository = companyCaseRepository;
        this.companyRepository = companyRepository;
    }
    // Invoked when a client connects to the server
    connect(socket) { console.log(' - CONNECTED    : %s', this.socket.id); }
    // Invoked when a client disconnects from the server
    disconnect() { console.log(' - DISCONNECTED : %s', this.socket.id); }
    // Debug handler for all events
    logMessage(...args) {
        //console.log(' - DEBUGGING    : %s - %s', this.socket.id, args[0][0]); 
    }
    // Handler for 'message' events
    handleCaseMessage(caseMessage) {
        // Extract the caseID from the namespace
        let namespaceParts = this.socket.nsp.name.split('/');
        let namespaceCaseID = namespaceParts[namespaceParts.length - 1];
        // Ensure the namespace matches the one supplied in the message
        if (namespaceCaseID != caseMessage.caseID) {
            // Swallow this error condition.  Someone is intentionally sending bad messages
        }
        else {
            // Save this message to the database
            this.caseMessageRepository.create(caseMessage).then(async (savedCaseMessage) => {
                // Notify all clients in this namespace about this message
                console.log(' - MESSAGE      : %s - %s', this.socket.id, caseMessage.message);
                this.socket.nsp.emit('message', `[${this.socket.id}] ${JSON.stringify(caseMessage)}`);
                // Retrieve the existing Case from storage
                let currentCase = await this.companyCaseRepository.findById(caseMessage.caseID);
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
                    if (assignedEmailAddress.length > 0) {
                        // Send the notification email to all assigned members of this Case
                        this.sendNewCaseMessageEmail(currentCase.caseNumber, savedCaseMessage, assignedEmailAddress);
                    }
                    else {
                        console.log('WARN: Noone to send an email to for new CaseMessage');
                    }
                }
                else {
                    console.log('WARN: Noone to send an email to for new CaseMessage');
                }
            }).catch((err) => {
                console.log('ERROR: Failed to save a CaseMessage');
                console.log(JSON.stringify(err));
            });
        }
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
    websocket_decorator_1.ws.connect(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CaseMessagesWSController.prototype, "connect", null);
__decorate([
    websocket_decorator_1.ws.disconnect(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CaseMessagesWSController.prototype, "disconnect", null);
__decorate([
    websocket_decorator_1.ws.subscribe(/.+/),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CaseMessagesWSController.prototype, "logMessage", null);
__decorate([
    websocket_decorator_1.ws.subscribe('message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.CaseMessage]),
    __metadata("design:returntype", void 0)
], CaseMessagesWSController.prototype, "handleCaseMessage", null);
CaseMessagesWSController = __decorate([
    websocket_decorator_1.ws('/messages'),
    __param(0, websocket_decorator_1.ws.socket()),
    __param(1, repository_1.repository(repositories_1.CaseMessageRepository)),
    __param(2, repository_1.repository(repositories_1.CompanyCaseRepository)),
    __param(3, repository_1.repository(repositories_1.CompanyRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.CaseMessageRepository,
        repositories_1.CompanyCaseRepository,
        repositories_1.CompanyRepository])
], CaseMessagesWSController);
exports.CaseMessagesWSController = CaseMessagesWSController;
//# sourceMappingURL=case-messages-ws.controller.js.map