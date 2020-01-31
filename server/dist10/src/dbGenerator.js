"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repositories_1 = require("./repositories");
const repositories_2 = require("./repositories");
const repositories_3 = require("./repositories");
const repositories_4 = require("./repositories");
const repositories_5 = require("./repositories");
const repositories_6 = require("./repositories");
const repositories_7 = require("./repositories");
const repositories_8 = require("./repositories");
const repositories_9 = require("./repositories");
const repositories_10 = require("./repositories");
const repositories_11 = require("./repositories");
const repositories_12 = require("./repositories");
async function createDB(app) {
    const ds = await app.get('datasources.cloudant');
    let counter = 0;
    let repoList = [{ repo: repositories_1.UserRepository, model: 'User' },
        { repo: repositories_2.CaseDocumentRepository, model: 'CaseDocument' },
        { repo: repositories_3.CaseEscortReceiptRepository, model: 'CaseEscortReceipt' },
        { repo: repositories_4.CaseMessageRepository, model: 'CaseMessage' },
        { repo: repositories_12.AppFeedbackRepository, model: 'AppFeedback' },
        { repo: repositories_5.CasePatientAssessmentRepository, model: 'CasePatientAssessment' },
        { repo: repositories_6.CasePatientProgressRepository, model: 'CasePatientProgress' },
        { repo: repositories_7.CompanyCaseRepository, model: 'CompanyCase' },
        { repo: repositories_8.CompanyUserRepository, model: 'CompanyUser' },
        { repo: repositories_9.CompanyRepository, model: 'Company' },
        { repo: repositories_10.EscortDocumentRepository, model: 'EscortDocument' },
        { repo: repositories_11.EscortRepository, model: 'Escort' },
        { repo: repositories_1.LoginAttemptRepository, model: 'LoginAttempt' }
    ];
    // Loop through each Repository in the list and schedule loading and generating it
    for (let i = 0; i < repoList.length; i++) {
        setTimeout(() => finishCreatingDB(app, ds, repoList[i].repo, repoList[i].model), (i + 1) * 5000);
    }
    counter += repoList.length;
    // Generate the default Users
    let allUsers = [{
            userID: 'super-admin',
            name: 'Super Admin',
            password: 'test',
            email: 'a@b.c',
            key2FA: 'empty',
            phoneNumber: '17276923653',
            role: 'admin',
            emailVerified: true
        }, {
            userID: 'chris-admin',
            name: 'Chris Williams',
            password: 'testtest',
            email: 'chris.williams@puremoneysystems.com',
            key2FA: 'empty',
            phoneNumber: '17276923653',
            role: 'admin',
            emailVerified: true
        }, {
            userID: 'mo-admin',
            name: 'Mo Williams',
            password: 'testtest',
            email: 'osoth01@gmail.com',
            key2FA: 'empty',
            phoneNumber: '18134641080',
            role: 'admin',
            emailVerified: true
        }, {
            userID: 'dan-admin',
            name: 'Dan Thompson',
            password: 'testtest',
            email: 'medicusinvestmentgroup@gmail.com',
            key2FA: 'empty',
            phoneNumber: '15185734201',
            role: 'admin',
            emailVerified: true
        }, {
            userID: 'steve-admin',
            name: 'Steve Avise',
            password: 'testtest',
            email: 'ops@skycareglobal.com',
            key2FA: 'empty',
            phoneNumber: '17274229454',
            role: 'admin',
            emailVerified: true
        }, {
            userID: 'mattia-admin',
            name: 'Mattia Cherubin',
            password: 'testtest',
            email: 'mattia.cherubin@skycareglobal.com',
            key2FA: 'empty',
            phoneNumber: "15185734201",
            role: 'admin',
            emailVerified: true
        }, {
            userID: 'chris-escort',
            name: 'Chris Williams (Escort)',
            password: 'testtest',
            email: 'chris@blockspaces.io',
            key2FA: 'empty',
            phoneNumber: '17274229454',
            role: 'escort',
            emailVerified: true
        }, {
            userID: 'chris-company',
            name: 'Chris Williams (Company)',
            password: 'testtest',
            email: 'chris.williams@logiclabs.us',
            key2FA: 'empty',
            phoneNumber: '17274229454',
            role: 'client',
            emailVerified: true
        }
    ];
    // Start timers for creating each User
    for (let j = 0; j < allUsers.length; j++) {
        setTimeout(async () => {
            const userRepository = await app.getRepository(repositories_1.UserRepository);
            userRepository.create(allUsers[j]);
        }, ((counter) + j) * 5000);
    }
    counter += allUsers.length;
    // Generate the default Escorts
    let escorts = [{
            userID: 'chris-escort',
            escortID: 'chris-escort-id',
            name: 'Chris Williams (Escort)'
        }];
    // Start timers for creating each Escort
    for (let k = 0; k < escorts.length; k++) {
        setTimeout(async () => {
            const escortRepository = await app.getRepository(repositories_11.EscortRepository);
            escortRepository.create(escorts[k]);
        }, ((counter) + k) * 5000);
    }
    counter += escorts.length;
    // Generate the default Company
    let companies = [{
            companyID: 'aig',
            name: 'AIG',
            emailForInvoices: 'test@aig.com'
        }];
    // Start timers for creating each Company
    for (let m = 0; m < companies.length; m++) {
        setTimeout(async () => {
            const companyRepository = await app.getRepository(repositories_9.CompanyRepository);
            companyRepository.create(companies[m]);
        }, ((counter) + m) * 5000);
    }
    counter += companies.length;
    // Generate the default CompanyUsers
    let companyUsers = [{
            companyID: 'aig',
            userID: 'chris-company',
            companyUserID: 'chris-company-aig',
            lastLogin: (new Date()).toISOString()
        }];
    // Start timers for creating each CompanyUser
    for (let n = 0; n < companyUsers.length; n++) {
        setTimeout(async () => {
            const companyUserRepository = await app.getRepository(repositories_8.CompanyUserRepository);
            companyUserRepository.create(companyUsers[n]);
        }, ((counter) + n) * 5000);
    }
    counter += companyUsers.length;
}
exports.createDB = createDB;
async function finishCreatingDB(app, ds, repository, modelName) {
    const currentRepository = await app.getRepository(repository);
    try {
        await ds.automigrate(modelName);
    }
    catch (err) {
        console.log('GOT AN ERROR');
        console.log(err);
    }
}
exports.finishCreatingDB = finishCreatingDB;
async function updateDB(app) {
    const ds = await app.get('datasources.cloudant');
    const userRepo = await app.getRepository(repositories_1.UserRepository);
    const caseDocRepo = await app.getRepository(repositories_2.CaseDocumentRepository);
    const caseEscortRecRepo = await app.getRepository(repositories_3.CaseEscortReceiptRepository);
    const caseMessageRepo = await app.getRepository(repositories_4.CaseMessageRepository);
    const appFeedbackRepo = await app.getRepository(repositories_12.AppFeedbackRepository);
    const casePatientAssessmentRepo = await app.getRepository(repositories_5.CasePatientAssessmentRepository);
    const casePatientProgressRepo = await app.getRepository(repositories_6.CasePatientProgressRepository);
    const companyCaseRepo = await app.getRepository(repositories_7.CompanyCaseRepository);
    const compnayUserRepo = await app.getRepository(repositories_8.CompanyUserRepository);
    const companyRepo = await app.getRepository(repositories_9.CompanyRepository);
    const escortDocRepo = await app.getRepository(repositories_10.EscortDocumentRepository);
    const escortRepo = await app.getRepository(repositories_11.EscortRepository);
    await ds.autoupdate();
}
exports.updateDB = updateDB;
//# sourceMappingURL=dbGenerator.js.map