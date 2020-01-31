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
const jwt_simple_1 = require("jwt-simple");
const cloudant = require("@cloudant/cloudant");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const config_1 = require("../config");
// @ts-ignore
const config = require("../datasources/cloudant.datasource.json");
const uuid62 = require('uuid62');
const sendgrid = require('@sendgrid/mail');
let CompanyCasesController = class CompanyCasesController {
    constructor(user, dsConfig = config, companyCaseRepository, companyRepository, readOnlyUserRepository, assessmentRepository, patientProgressRepository, documentRepository, escortReceiptsRepository, messageRepository) {
        this.user = user;
        this.dsConfig = dsConfig;
        this.companyCaseRepository = companyCaseRepository;
        this.companyRepository = companyRepository;
        this.readOnlyUserRepository = readOnlyUserRepository;
        this.assessmentRepository = assessmentRepository;
        this.patientProgressRepository = patientProgressRepository;
        this.documentRepository = documentRepository;
        this.escortReceiptsRepository = escortReceiptsRepository;
        this.messageRepository = messageRepository;
        // Configure our API services
        sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    }
    async find(credentials, companyID, filter) {
        // Decode the JWT so we know the current user role
        let jwt = credentials.substr(credentials.indexOf(' ') + 1);
        let token = jwt_simple_1.decode(jwt, config_1.Config.jwt.encryptingKey, false, config_1.Config.jwt.algorithm);
        // Connect to the Cloudant manually
        let cloudantConnection = cloudant(this.dsConfig);
        // Query the 'skycare' database, viewing the 'cases' design document, based on the current user role
        let queryResponse = await cloudantConnection.use('skycare').view('cases', 'active');
        if (queryResponse.total_rows == 0) {
            return [];
        }
        else {
            // Break the QueryResponse into Escorts, Companies, and CompanyCases
            let escorts = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('ESCORT')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    escortID: vxAsAny._id,
                    name: vxAsAny.name,
                    userID: vxAsAny.userID
                };
            });
            let companies = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('COMPANY')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    companyID: vxAsAny._id,
                    emailForInvoices: vxAsAny.emailForInvoices,
                    name: vxAsAny.name
                };
            });
            let companyCases = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('CASE')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    caseID: vxAsAny._id,
                    caseNumber: vxAsAny.caseNumber,
                    companyID: vxAsAny.companyID,
                    companyName: '',
                    currentStatus: vxAsAny.currentStatus,
                    patientFirstName: vxAsAny.patientFirstName,
                    patientLastName: vxAsAny.patientLastName,
                    diagnosis: vxAsAny.diagnosis,
                    firstDayOfTravel: vxAsAny.firstDayOfTravel,
                    numberTravelDays: vxAsAny.numberTravelDays,
                    originCity: vxAsAny.originCity,
                    destinationCity: vxAsAny.destinationCity,
                    quotedPrice: vxAsAny.quotedPrice,
                    invoiceSent: vxAsAny.invoiceSent,
                    invoicePaid: vxAsAny.invoicePaid,
                    flightNumber1: vxAsAny.flightNumber1,
                    connectionCity1: vxAsAny.connectionCity1,
                    flightNumber2: vxAsAny.flightNumber2,
                    connectionCity2: vxAsAny.connectionCity2,
                    flightNumber3: vxAsAny.flightNumber3,
                    payPerDay: vxAsAny.payPerDay,
                    externalAccessEmail1: vxAsAny.externalAccessEmail1,
                    externalAccessEmail2: vxAsAny.externalAccessEmail2,
                    externalAccessEmail3: vxAsAny.externalAccessEmail3,
                    escorts: vxAsAny.escorts,
                    statusChanges: vxAsAny.statusChanges
                };
            });
            // Remove all cases except the ones belonging to the requested company, if the requestor is a company
            if (token.role == 'client' && companyID != 'UNKNOWN') {
                companyCases = companyCases.filter((v, i, l) => { return v.companyID == companyID; });
            }
            // Embellish each CompanyCase with actual Company.name and the Escort.name values
            for (let i = companyCases.length - 1; i > -1; i--) {
                let company = companies.find((v, ix, l) => { return (v.companyID == companyCases[i].companyID); });
                companyCases[i].companyName = (company != undefined) ? company.name : '';
                // Remove all escorts except the current escort, if the requestor is an escort
                if (token.role == 'escort') {
                    let currentEscort = escorts.filter((v, ix, l) => { return (v.userID == token.sub); });
                    if (currentEscort.length > 0) {
                        // Check the current case to see if the current escort was assigned
                        let assignedEscort = companyCases[i].escorts.filter((v, ix, l) => { return (v.escortID == currentEscort[0].escortID); });
                        // If we found the current escort has been assigned, then make sure this is the only escort attached to the case
                        if (assignedEscort.length > 0) {
                            companyCases[i].escorts = [assignedEscort[0]];
                        }
                        else {
                            // This case is not assigned to this escort.  Remove it and move to the next one
                            companyCases.splice(i, 1);
                            continue;
                        }
                    }
                    else {
                        // The logged in escort is not in the list of all escorts?.  Remove the case and move to the next one
                        companyCases.splice(i, 1);
                        continue;
                    }
                }
                for (let j = 0; j < companyCases[i].escorts.length; j++) {
                    let escort = escorts.find((vx, ix, lx) => { return (vx.escortID == companyCases[i].escorts[j].escortID); });
                    companyCases[i].escorts[j].name = (escort != undefined) ? escort.name : '';
                }
            }
            return companyCases;
        }
    }
    async create(companyID, companyCase) {
        // Ensure the CompanyCase matches the companyID in the path
        this.ensureCaseMatchesCompanyID(companyCase, companyID);
        // Create the new CompanyCase record in the database and return the result
        let createdCase = await this.companyCaseRepository.create(companyCase);
        // Need to notify the Client and the assigned Escorts that they have access to this Case
        let assignedEmailAddress = [];
        // Lookup the Company associated with this Case
        let company = await this.companyRepository.findById(companyCase.companyID);
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
        for (let x = 0; x < companyCase.escorts.length; x++) {
            if (companyCase.escorts[x].email !== undefined && companyCase.escorts[x].email !== null) {
                // @ts-ignore
                assignedEmailAddress.push(companyCase.escorts[x].email);
            }
        }
        if (assignedEmailAddress.length > 0) {
            // Send the notification email to all assigned members of this Case
            this.sendNewCaseAssignmentEmail(companyCase, assignedEmailAddress);
        }
        // If any Email accesses were specified, then we need to setup their limited accounts and send them emails
        if (companyCase.externalAccessEmail1 !== undefined || companyCase.externalAccessEmail2 !== undefined || companyCase.externalAccessEmail3 !== undefined) {
            let externalAccessEmails = [];
            if (companyCase.externalAccessEmail1 !== undefined && companyCase.externalAccessEmail1.trim() != '') {
                externalAccessEmails.push(companyCase.externalAccessEmail1);
            }
            if (companyCase.externalAccessEmail2 !== undefined && companyCase.externalAccessEmail2.trim() != '') {
                externalAccessEmails.push(companyCase.externalAccessEmail2);
            }
            if (companyCase.externalAccessEmail3 !== undefined && companyCase.externalAccessEmail3.trim() != '') {
                externalAccessEmails.push(companyCase.externalAccessEmail3);
            }
            // Loop through the list of external access email, creating a record for each one and sending them emails
            for (let i = 0; i < externalAccessEmails.length; i++) {
                // Delay this step so that database updates are staggered
                setTimeout((async (email, caseID, caseNumber) => {
                    // Create the limited access account for this email address
                    let readOnlyUser = {
                        externalAccessID: uuid62.v4(),
                        email: email,
                        caseID: caseID
                    };
                    // Store the ReadOnlyUser in the database
                    let savedReadyOnlyUser = await this.readOnlyUserRepository.create(readOnlyUser);
                    // Send the ReadOnlyUser an email invitation
                    this.sendExternalAccessEmail(savedReadyOnlyUser, caseNumber);
                }).bind(this, externalAccessEmails[i], createdCase.caseID, createdCase.caseNumber), 1000 * (i + 1));
            }
        }
        return createdCase;
    }
    async findById(companyID, caseID) {
        let requestedCase = await this.companyCaseRepository.findById(caseID);
        if (requestedCase === undefined || requestedCase == null) {
            return requestedCase;
        }
        let company = await this.companyRepository.findById(requestedCase.companyID);
        requestedCase.companyName = company.name;
        return requestedCase;
    }
    async findByExternalAccessId(externalAccessID) {
        // Retrieve the ReadOnlyUser in the database
        //let savedReadyOnlyUser : ReadOnlyUser = await this.readOnlyUserRepository.findById(externalAccessID);
        // Use this to retrieve the Case
        return await this.companyCaseRepository.findById(this.user.caseID);
    }
    async updateById(companyID, caseID, modifiedCase, sendEmail, emailComments) {
        // Ensure the CompanyCase matches the companyID in the path
        await this.ensureCaseMatchesCompanyID(modifiedCase, companyID);
        // Retrieve the existing CompanyCase
        let existingCompanyCase = await this.companyCaseRepository.findById(caseID);
        // Update the CompanyCase in the database
        await this.companyCaseRepository.updateById(caseID, modifiedCase);
        // Detect if any Escorts were added to this Case
        let newEscortEmailAddresses = modifiedCase.escorts.map((v, i, l) => {
            if (existingCompanyCase.escorts.findIndex((vx, ix, lx) => { return vx.escortID == v.escortID; }) == -1) {
                return String(v.email);
            }
            else {
                return '';
            }
        }).filter((vxx, ixx, lxx) => {
            if (vxx !== undefined && vxx !== null && vxx !== '' && vxx.trim().length > 0) {
                return vxx;
            }
        });
        if (newEscortEmailAddresses.length > 0) {
            // Send the notification email to all assigned members of this Case
            this.sendNewCaseAssignmentEmail(modifiedCase, newEscortEmailAddresses);
        }
        // Check if any Email accesses were modified, then we need to setup their limited accounts and send them emails
        if (modifiedCase.externalAccessEmail1 !== undefined || modifiedCase.externalAccessEmail2 !== undefined || modifiedCase.externalAccessEmail3 !== undefined) {
            let externalAccessEmailsToAdd = [];
            let externalAccessEmailsToRemove = [];
            if (modifiedCase.externalAccessEmail1 !== undefined && modifiedCase.externalAccessEmail1.trim() != '') {
                externalAccessEmailsToAdd.push(modifiedCase.externalAccessEmail1);
            }
            if (modifiedCase.externalAccessEmail2 !== undefined && modifiedCase.externalAccessEmail2.trim() != '') {
                externalAccessEmailsToAdd.push(modifiedCase.externalAccessEmail2);
            }
            if (modifiedCase.externalAccessEmail3 !== undefined && modifiedCase.externalAccessEmail3.trim() != '') {
                externalAccessEmailsToAdd.push(modifiedCase.externalAccessEmail3);
            }
            if (existingCompanyCase.externalAccessEmail1 !== undefined && existingCompanyCase.externalAccessEmail1.trim() != '') {
                externalAccessEmailsToRemove.push(existingCompanyCase.externalAccessEmail1);
            }
            if (existingCompanyCase.externalAccessEmail2 !== undefined && existingCompanyCase.externalAccessEmail2.trim() != '') {
                externalAccessEmailsToRemove.push(existingCompanyCase.externalAccessEmail2);
            }
            if (existingCompanyCase.externalAccessEmail3 !== undefined && existingCompanyCase.externalAccessEmail3.trim() != '') {
                externalAccessEmailsToRemove.push(existingCompanyCase.externalAccessEmail3);
            }
            // Trim both lists to only the differences
            for (let i = externalAccessEmailsToRemove.length - 1; i >= 0; i--) {
                let addListIndex = externalAccessEmailsToAdd.indexOf(externalAccessEmailsToRemove[i]);
                if (addListIndex > -1) {
                    externalAccessEmailsToRemove.splice(i, 1);
                    externalAccessEmailsToAdd.splice(addListIndex, 1);
                }
            }
            // Loop through the list of external access emails needing to be removed, deleting each ReadOnlyUser record
            for (let j = 0; j < externalAccessEmailsToRemove.length; j++) {
                // Delete the ReadOnlyUser from the database
                let searchCondition = {
                    email: externalAccessEmailsToRemove[j],
                    caseID: modifiedCase.caseID
                };
                let count = await this.readOnlyUserRepository.deleteAll(searchCondition);
                console.log('deleted ' + count.count + ' ReadOnlyUser records for ' + externalAccessEmailsToRemove[j] + ' - ' + modifiedCase.caseID);
            }
            // Loop through the list of external access emails needing to be added, creating a record for each one and sending them emails
            for (let k = 0; k < externalAccessEmailsToAdd.length; k++) {
                // Delay this step so that database updates are staggered
                setTimeout((async (email, caseID, caseNumber) => {
                    // Create the limited access account for this email address
                    let readOnlyUser = {
                        externalAccessID: uuid62.v4(),
                        email: email,
                        caseID: caseID
                    };
                    // Store the ReadOnlyUser in the database
                    let savedReadyOnlyUser = await this.readOnlyUserRepository.create(readOnlyUser);
                    // Send the ReadOnlyUser an email invitation
                    this.sendExternalAccessEmail(savedReadyOnlyUser, caseNumber);
                    console.log('created a ReadOnlyUser record for ' + email + ' - ' + caseID + ' - ' + caseNumber);
                }).bind(this, externalAccessEmailsToAdd[k], modifiedCase.caseID, modifiedCase.caseNumber), 1000 * (externalAccessEmailsToRemove.length + k + 1));
            }
        }
        // Check if we are supposed to send an email notification about the most recent status change for this Case
        if (sendEmail !== undefined && sendEmail != null && sendEmail == true) {
            // Lookup the Company associated with this Case
            let company = await this.companyRepository.findById(modifiedCase.companyID);
            let emailAddressesToSendNoticeTo = [];
            if (company.emailForUpdates1 !== undefined && company.emailForUpdates1 != null) {
                emailAddressesToSendNoticeTo.push(company.emailForUpdates1);
            }
            if (company.emailForUpdates2 !== undefined && company.emailForUpdates2 != null) {
                emailAddressesToSendNoticeTo.push(company.emailForUpdates2);
            }
            if (company.emailForUpdates3 !== undefined && company.emailForUpdates3 != null) {
                emailAddressesToSendNoticeTo.push(company.emailForUpdates3);
            }
            // Only send the notifications if an email address was specified for the Company
            if (emailAddressesToSendNoticeTo.length > 0) {
                this.sendStatusChangeNotificationEmail(modifiedCase, emailAddressesToSendNoticeTo, emailComments);
            }
        }
    }
    async findUnpaidEscorts() {
        // Connect to the Cloudant manually
        let cloudantConnection = cloudant(this.dsConfig);
        // Query the 'skycare' database, viewing the 'cases' design document, based on the current user role
        let queryResponse = await cloudantConnection.use('skycare').view('cases', 'active');
        if (queryResponse.total_rows == 0) {
            return [];
        }
        else {
            // Break the QueryResponse into Escorts, EscortReceipts, Companies, and CompanyCases
            let escorts = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('ESCORT')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    escortID: vxAsAny._id,
                    name: vxAsAny.name,
                    userID: vxAsAny.userID
                };
            });
            let escortReceipts = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('ESCORTRECEIPT')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    receiptID: vxAsAny._id,
                    caseID: vxAsAny.caseID,
                    escortID: vxAsAny.escortID,
                    name: vxAsAny.name,
                    amount: vxAsAny.amount,
                    usdAmount: vxAsAny.usdAmount,
                    alternateName: vxAsAny.alternateName,
                    currencyType: vxAsAny.currencyType,
                    createDate: vxAsAny.createDate,
                    receiptDate: vxAsAny.receiptDate,
                    storageHash: vxAsAny.storageHash
                };
            });
            let companies = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('COMPANY')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    companyID: vxAsAny._id,
                    emailForInvoices: vxAsAny.emailForInvoices,
                    name: vxAsAny.name
                };
            });
            let companyCases = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('CASE') && v.value.currentStatus == 'All case documentation & receipts complete') {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    caseID: vxAsAny._id,
                    caseNumber: vxAsAny.caseNumber,
                    companyID: vxAsAny.companyID,
                    companyName: '',
                    currentStatus: vxAsAny.currentStatus,
                    patientFirstName: vxAsAny.patientFirstName,
                    patientLastName: vxAsAny.patientLastName,
                    diagnosis: vxAsAny.diagnosis,
                    firstDayOfTravel: vxAsAny.firstDayOfTravel,
                    numberTravelDays: vxAsAny.numberTravelDays,
                    originCity: vxAsAny.originCity,
                    destinationCity: vxAsAny.destinationCity,
                    quotedPrice: vxAsAny.quotedPrice,
                    invoiceSent: vxAsAny.invoiceSent,
                    invoicePaid: vxAsAny.invoicePaid,
                    flightNumber1: vxAsAny.flightNumber1,
                    connectionCity1: vxAsAny.connectionCity1,
                    flightNumber2: vxAsAny.flightNumber2,
                    connectionCity2: vxAsAny.connectionCity2,
                    flightNumber3: vxAsAny.flightNumber3,
                    payPerDay: vxAsAny.payPerDay,
                    externalAccessEmail1: vxAsAny.externalAccessEmail1,
                    externalAccessEmail2: vxAsAny.externalAccessEmail2,
                    externalAccessEmail3: vxAsAny.externalAccessEmail3,
                    escorts: vxAsAny.escorts,
                    statusChanges: vxAsAny.statusChanges
                };
            });
            // Embellish each CompanyCase with actual Company.name, Escort.name, and CaseEscortReceipt values
            for (let i = companyCases.length - 1; i > -1; i--) {
                let caseID = companyCases[i].caseID;
                let company = companies.find((vx, ix, lx) => { return (vx.companyID == companyCases[i].companyID); });
                companyCases[i].companyName = (company != undefined) ? company.name : '';
                for (let j = 0; j < companyCases[i].escorts.length; j++) {
                    let escort = escorts.find((vx, ix, lx) => { return (vx.escortID == companyCases[i].escorts[j].escortID); });
                    companyCases[i].escorts[j].name = (escort != undefined) ? escort.name : '';
                }
                for (let j = 0; j < companyCases[i].escorts.length; j++) {
                    let escortID = companyCases[i].escorts[j].escortID;
                    let receipts = escortReceipts.filter((v, i, l) => { if (v.caseID == caseID && v.escortID == escortID) {
                        return v;
                    } });
                    if (companyCases[i].escortReceipts !== undefined && companyCases[i].escortReceipts != null && companyCases[i].escortReceipts.length > 0) {
                        companyCases[i].escortReceipts.concat(receipts);
                    }
                    else {
                        companyCases[i].escortReceipts = receipts;
                    }
                }
            }
            return companyCases;
        }
    }
    async markCaseEscortPaid(caseID, escortID) {
        try {
            // Retrieve the existing CompanyCase
            let existingCompanyCase = await this.companyCaseRepository.findById(caseID);
            // Update the CompanyCase in the database
            let escortIndex = existingCompanyCase.escorts.findIndex((v, i, l) => { return v.escortID == escortID; });
            existingCompanyCase.escorts[escortIndex].paid = true;
            await this.companyCaseRepository.updateById(caseID, existingCompanyCase);
            // Check if Case should be archived
            await this.archiveCaseIfComplete(existingCompanyCase);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async findUnpaidCases() {
        // Connect to the Cloudant manually
        let cloudantConnection = cloudant(this.dsConfig);
        // Query the 'skycare' database, viewing the 'cases' design document, based on the current user role
        let queryResponse = await cloudantConnection.use('skycare').view('cases', 'active');
        if (queryResponse.total_rows == 0) {
            return [];
        }
        else {
            // Break the QueryResponse into Escorts, EscortReceipts, Companies, and CompanyCases
            let escorts = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('ESCORT')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    escortID: vxAsAny._id,
                    name: vxAsAny.name,
                    userID: vxAsAny.userID
                };
            });
            let companies = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('COMPANY')) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    companyID: vxAsAny._id,
                    emailForInvoices: vxAsAny.emailForInvoices,
                    name: vxAsAny.name
                };
            });
            let companyCases = queryResponse.rows.filter((v, i, l) => {
                if (v.key.includes('CASE') && v.value.currentStatus == 'All case documentation & receipts complete' && v.value.invoiceSent == true && v.value.invoicePaid != true) {
                    return v;
                }
            }).map((vx, ix, lx) => {
                let vxAsAny = vx.value;
                return {
                    caseID: vxAsAny._id,
                    caseNumber: vxAsAny.caseNumber,
                    companyID: vxAsAny.companyID,
                    companyName: '',
                    currentStatus: vxAsAny.currentStatus,
                    patientFirstName: vxAsAny.patientFirstName,
                    patientLastName: vxAsAny.patientLastName,
                    diagnosis: vxAsAny.diagnosis,
                    firstDayOfTravel: vxAsAny.firstDayOfTravel,
                    numberTravelDays: vxAsAny.numberTravelDays,
                    originCity: vxAsAny.originCity,
                    destinationCity: vxAsAny.destinationCity,
                    quotedPrice: vxAsAny.quotedPrice,
                    invoiceSent: vxAsAny.invoiceSent,
                    invoicePaid: vxAsAny.invoicePaid,
                    flightNumber1: vxAsAny.flightNumber1,
                    connectionCity1: vxAsAny.connectionCity1,
                    flightNumber2: vxAsAny.flightNumber2,
                    connectionCity2: vxAsAny.connectionCity2,
                    flightNumber3: vxAsAny.flightNumber3,
                    payPerDay: vxAsAny.payPerDay,
                    externalAccessEmail1: vxAsAny.externalAccessEmail1,
                    externalAccessEmail2: vxAsAny.externalAccessEmail2,
                    externalAccessEmail3: vxAsAny.externalAccessEmail3,
                    escorts: vxAsAny.escorts,
                    statusChanges: vxAsAny.statusChanges
                };
            });
            // Embellish each CompanyCase with actual Company.name, Escort.name, and CaseEscortReceipt values
            for (let i = companyCases.length - 1; i > -1; i--) {
                let caseID = companyCases[i].caseID;
                let company = companies.find((v, vi, l) => { return (v.companyID == companyCases[i].companyID); });
                companyCases[i].companyName = (company != undefined) ? company.name : '';
                for (let j = 0; j < companyCases[i].escorts.length; j++) {
                    let escort = escorts.find((vx, ix, lx) => { return (vx.escortID == companyCases[i].escorts[j].escortID); });
                    companyCases[i].escorts[j].name = (escort != undefined) ? escort.name : '';
                }
            }
            return companyCases;
        }
    }
    async markCasePaid(caseID) {
        try {
            // Retrieve the existing CompanyCase
            let existingCompanyCase = await this.companyCaseRepository.findById(caseID);
            // Update the CompanyCase in the database
            existingCompanyCase.invoicePaid = true;
            await this.companyCaseRepository.updateById(caseID, existingCompanyCase);
            // Check if Case should be archived
            await this.archiveCaseIfComplete(existingCompanyCase);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async findArchivedCases() {
        return await this.companyCaseRepository.find({ where: { currentStatus: 'ARCHIVED' } });
    }
    ensureCaseMatchesCompanyID(companyCase, companyID) {
        // Throw errors if the companyID's do not match
        if (companyCase.companyID != companyID) {
            throw new rest_1.HttpErrors.BadRequest('CompanyID provided in the request path does not match the CompanyCase companyID');
        }
    }
    sendNewCaseAssignmentEmail(newCase, emailAddresses) {
        // CASE_ID = newCase.caseID
        // ACCESS_URL = process.env.MAIN_URL + '/case/view/' + CASE_ID
        // Send an email to all participants on the new Case
        for (let i = 0; i < emailAddresses.length; i++) {
            const emailMessage = {
                to: emailAddresses[i].toLowerCase(),
                from: config_1.Config.email.newCaseAssigned.fromEmail,
                templateId: config_1.Config.email.newCaseAssigned.templateID,
                dynamic_template_data: {
                    CASE_ID: newCase.caseNumber,
                    ACCESS_URL: process.env.MAIN_URL + config_1.Config.email.newCaseAssigned.linkBaseURL + newCase.caseID
                }
            };
            sendgrid.send(emailMessage);
        }
    }
    sendExternalAccessEmail(readOnlyUser, caseNumber) {
        // Send an email to the new User, inviting them to setup their account
        const emailMessage = {
            to: readOnlyUser.email.toLowerCase(),
            from: config_1.Config.email.limitedCaseAccess.fromEmail,
            templateId: config_1.Config.email.limitedCaseAccess.templateID,
            dynamic_template_data: {
                CASE_ID: caseNumber,
                ACCESS_URL: process.env.MAIN_URL + config_1.Config.email.limitedCaseAccess.linkBaseURL + readOnlyUser.externalAccessID
            }
        };
        sendgrid.send(emailMessage);
    }
    sendStatusChangeNotificationEmail(modifiedCase, emailAddresses, emailComments = '') {
        // Send an email to anyone associated with the client Company that is requesting updates
        for (let i = 0; i < emailAddresses.length; i++) {
            const emailMessage = {
                to: emailAddresses[i].toLowerCase(),
                from: config_1.Config.email.statusChangeNotification.fromEmail,
                templateId: config_1.Config.email.statusChangeNotification.templateID,
                dynamic_template_data: {
                    CASE_ID: modifiedCase.caseNumber,
                    NEW_STATUS: modifiedCase.currentStatus,
                    COMMENTS: emailComments
                }
            };
            sendgrid.send(emailMessage);
        }
    }
    async archiveCaseIfComplete(companyCase) {
        const FINAL_CASE_STATUS = 'All case documentation & receipts complete';
        // Check if the current status is the FINAL status
        if (companyCase.currentStatus != FINAL_CASE_STATUS) {
            return;
        }
        // Check if the invoice is marked PAID
        if (companyCase.invoicePaid != true) {
            return;
        }
        // Check if all escorts are marked PAID
        if (companyCase.escorts.some((v, i, l) => { return v.paid != true; })) {
            return;
        }
        // Change the case status to ARCHIVED
        let newCaseStatusChange = {
            newStatus: 'ARCHIVED',
            oldStatus: companyCase.currentStatus,
            date: (new Date()).toISOString()
        };
        companyCase.currentStatus = 'ARCHIVED';
        companyCase.statusChanges.push(newCaseStatusChange);
        // Repackage case to include all parts in a single document 
        let escortReceipts = await this.escortReceiptsRepository.find({ where: { caseID: companyCase.caseID } });
        companyCase.escortReceipts = escortReceipts;
        let documents = await this.documentRepository.find({ where: { caseID: companyCase.caseID } });
        companyCase.documents = documents;
        let messages = await this.messageRepository.find({ where: { caseID: companyCase.caseID } });
        companyCase.messages = messages;
        // Save the archived case to the database
        await this.companyCaseRepository.updateById(companyCase.caseID, companyCase);
        // Delete all separate case child documents
        await this.patientProgressRepository.deleteAll({ caseID: companyCase.caseID });
        await this.assessmentRepository.deleteAll({ caseID: companyCase.caseID });
        await this.escortReceiptsRepository.deleteAll({ caseID: companyCase.caseID });
        await this.documentRepository.deleteAll({ caseID: companyCase.caseID });
        await this.messageRepository.deleteAll({ caseID: companyCase.caseID });
    }
};
__decorate([
    rest_1.get('/companies/{companyID}/cases', {
        responses: {
            '200': {
                description: 'Array of CompanyCase model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CompanyCase } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.header.string('Authorization')),
    __param(1, rest_1.param.path.string('companyID')),
    __param(2, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CompanyCase))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "find", null);
__decorate([
    rest_1.post('/companies/{companyID}/cases', {
        responses: {
            '200': {
                description: 'CompanyCase model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CompanyCase } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, models_1.CompanyCase]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "create", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}', {
        responses: {
            '200': {
                description: 'CompanyCase model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CompanyCase } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "findById", null);
__decorate([
    rest_1.get('/publicCases/{externalAccessID}', {
        responses: {
            '200': {
                description: 'CompanyCase model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CompanyCase } } },
            },
        },
    }),
    authentication_1.authenticate('LimitedStrategy'),
    __param(0, rest_1.param.path.string('externalAccessID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "findByExternalAccessId", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}', {
        responses: {
            '204': {
                description: 'CompanyCase PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __param(3, rest_1.param.query.boolean('sendEmail')),
    __param(4, rest_1.param.query.string('emailComments')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CompanyCase, Boolean, String]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "updateById", null);
__decorate([
    rest_1.get('/companies/UNDEFINED/cases/UNDEFINED/unpaidEscorts', {
        responses: {
            '200': {
                description: 'Array of CompanyCase model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CompanyCase } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "findUnpaidEscorts", null);
__decorate([
    rest_1.post('/companies/UNDEFINED/cases/{caseID}/unpaidEscorts/{escortID}', {
        responses: {
            '200': {
                description: 'Success / Failure indication',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('caseID')),
    __param(1, rest_1.param.path.string('escortID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "markCaseEscortPaid", null);
__decorate([
    rest_1.get('/companies/UNDEFINED/unpaidCases', {
        responses: {
            '200': {
                description: 'Array of CompanyCase model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CompanyCase } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "findUnpaidCases", null);
__decorate([
    rest_1.post('/companies/UNDEFINED/unpaidCases/{caseID}', {
        responses: {
            '200': {
                description: 'Success / Failure indication',
                content: { 'application/json': { schema: { type: 'boolean' } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('caseID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "markCasePaid", null);
__decorate([
    rest_1.get('/companies/UNDEFINED/archivedCases', {
        responses: {
            '200': {
                description: 'Array of CompanyCase model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CompanyCase } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompanyCasesController.prototype, "findArchivedCases", null);
CompanyCasesController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, context_1.inject('datasources.config.cloudant', { optional: true })),
    __param(2, repository_1.repository(repositories_1.CompanyCaseRepository)),
    __param(3, repository_1.repository(repositories_1.CompanyRepository)),
    __param(4, repository_1.repository(repositories_1.ReadOnlyUserRepository)),
    __param(5, repository_1.repository(repositories_1.CasePatientAssessmentRepository)),
    __param(6, repository_1.repository(repositories_1.CasePatientProgressRepository)),
    __param(7, repository_1.repository(repositories_1.CaseDocumentRepository)),
    __param(8, repository_1.repository(repositories_1.CaseEscortReceiptRepository)),
    __param(9, repository_1.repository(repositories_1.CaseMessageRepository)),
    __metadata("design:paramtypes", [Object, Object, repositories_1.CompanyCaseRepository,
        repositories_1.CompanyRepository,
        repositories_1.ReadOnlyUserRepository,
        repositories_1.CasePatientAssessmentRepository,
        repositories_1.CasePatientProgressRepository,
        repositories_1.CaseDocumentRepository,
        repositories_1.CaseEscortReceiptRepository,
        repositories_1.CaseMessageRepository])
], CompanyCasesController);
exports.CompanyCasesController = CompanyCasesController;
//# sourceMappingURL=company-cases.controller.js.map