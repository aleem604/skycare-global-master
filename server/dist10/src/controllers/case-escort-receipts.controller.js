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
const secureDocStorage_1 = require("../helpers/secureDocStorage");
const mimeTypeResolver_1 = require("../helpers/mimeTypeResolver");
const multer = require("multer");
const uuid62 = require('uuid62');
const FORM_DATA = 'multipart/form-data';
let CaseEscortReceiptsController = class CaseEscortReceiptsController {
    constructor(user, caseRepository, caseEscortReceiptRepository) {
        this.user = user;
        this.caseRepository = caseRepository;
        this.caseEscortReceiptRepository = caseEscortReceiptRepository;
        this.secureDocStorage = new secureDocStorage_1.SecureDocumentStorage();
    }
    async create(companyID, caseID, caseEscortReceipt) {
        // Ensure the CaseEscortReceipt matches the caseID in the path
        this.ensureEscortReceiptMatchesCaseID(caseEscortReceipt, caseID);
        // Create the new CaseEscortReceipt record in the database and return the result
        return await this.caseEscortReceiptRepository.create(caseEscortReceipt);
    }
    async addCaseEscortReceiptToSecureStorage(companyID, caseID, receiptID, request, response) {
        // Extend the Request and Response timeouts
        request.setTimeout(600 * 1000, () => { });
        response.setTimeout(600 * 1000);
        // Create an upload handler
        let uploadHandler = this.provisionUploadHandler();
        // Return a promise that will process the uploaded file and send a result
        return new Promise((resolve, reject) => {
            // Receive any single file from the posted body in a field named 'file0'
            uploadHandler.single('file0')(request, response, err => {
                if (err) {
                    return reject(err);
                }
                // Detect if the file data was provided as a DataURL or an attached File
                if (request.body !== undefined && request.body.file0 !== undefined) {
                    // This file was provided as a DataURL
                    // Convert the DataURL into just the Base64 data
                    let imageBase64Data = request.body.file0.replace(/^data:[A-Za-z-+\/]+;base64,/, "");
                    // Store the uploaded file to secure storage
                    this.secureDocStorage.sendBase64DataToStorage(receiptID, imageBase64Data, true).then((storageHash) => {
                        // Retrieve the CaseEscortReceipt from the database
                        this.caseEscortReceiptRepository.findById(receiptID).then((caseEscortReceipt) => {
                            // Update the CaseEscortReceipt with details from SecureStorage
                            caseEscortReceipt.storageHash = storageHash;
                            caseEscortReceipt.createDate = (new Date()).toISOString();
                            // Store the updated CaseEscortReceipt in the database
                            this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                                resolve(caseEscortReceipt);
                            });
                        });
                    });
                }
                else if (request.file !== undefined && request.file.path !== undefined) {
                    // This file was provided as an attachment
                    // Store the uploaded file in secure storage
                    this.secureDocStorage.sendFileToStorage(receiptID, request.file.path, true).then((storageHash) => {
                        // Retrieve the CaseEscortReceipt from the database
                        this.caseEscortReceiptRepository.findById(receiptID).then((caseEscortReceipt) => {
                            // Update the CaseEscortReceipt with details from SecureStorage
                            caseEscortReceipt.storageHash = storageHash;
                            caseEscortReceipt.createDate = (new Date()).toISOString();
                            // Store the updated CaseEscortReceipt in the database
                            this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                                resolve(caseEscortReceipt);
                            });
                        });
                    });
                }
                else {
                    // No file was provided.  This is an ERROR condition
                    throw new rest_1.HttpErrors.BadRequest('No File was provided in the request, either as a DataURL or a file attachment.');
                }
            });
        });
    }
    async find(companyID, caseID, filter) {
        if (filter === undefined) {
            filter = { where: { caseID: caseID } };
        }
        return await this.caseEscortReceiptRepository.find(filter);
    }
    async findById(companyID, caseID, receiptID) {
        return await this.caseEscortReceiptRepository.findById(receiptID);
    }
    async getCaseEscortReceiptFromSecureStorage(companyID, caseID, receiptID, archivedCase = false, response) {
        // Extend the Response timeouts
        response.setTimeout(600 * 1000);
        // Return a promise that will send the stored file
        return new Promise((resolve, reject) => {
            if (archivedCase) {
                // Retrieve the CaseEscortReceipt from the database
                this.caseRepository.findById(caseID).then((currentCase) => {
                    let caseEscortReceipt = currentCase.escortReceipts.filter((v, i, l) => { return v.receiptID == receiptID; })[0];
                    // Make sure this CaseEscortReceipt references a file in SecureStorage
                    if (caseEscortReceipt.storageHash == null || caseEscortReceipt.storageHash == undefined) {
                        reject(new Error('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null'));
                        return false;
                    }
                    // Retrieve the stored file from secure storage
                    this.secureDocStorage.retrieveBinaryDataFromStorage(caseEscortReceipt.receiptID, caseEscortReceipt.storageHash, true).then((escortReceiptFile) => {
                        // Attach the returned file to the Response
                        response.attachment(caseEscortReceipt.name);
                        response.contentType(mimeTypeResolver_1.MimeTypeResolver.resolveMimeType(caseEscortReceipt.name));
                        response.send(escortReceiptFile);
                        return true;
                    });
                });
            }
            else {
                // Retrieve the CaseEscortReceipt from the database
                this.caseEscortReceiptRepository.findById(receiptID).then((caseEscortReceipt) => {
                    // Make sure this CaseEscortReceipt references a file in SecureStorage
                    if (caseEscortReceipt.storageHash == null || caseEscortReceipt.storageHash == undefined) {
                        reject(new Error('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null'));
                        return false;
                    }
                    // Retrieve the stored file from secure storage
                    this.secureDocStorage.retrieveBinaryDataFromStorage(caseEscortReceipt.receiptID, caseEscortReceipt.storageHash, true).then((escortReceiptFile) => {
                        // Attach the returned file to the Response
                        response.attachment(caseEscortReceipt.name);
                        response.contentType(mimeTypeResolver_1.MimeTypeResolver.resolveMimeType(caseEscortReceipt.name));
                        response.send(escortReceiptFile);
                        return true;
                    });
                });
            }
        });
    }
    async updateById(companyID, caseID, receiptID, caseEscortReceipt) {
        // Ensure the CaseEscortReceipt matches the caseID in the path
        this.ensureEscortReceiptMatchesCaseID(caseEscortReceipt, caseID);
        await this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt);
    }
    async updateCaseEscortReceiptInSecureStorage(companyID, caseID, receiptID, request, response) {
        // Extend the Request and Response timeouts
        request.setTimeout(600 * 1000, () => { });
        response.setTimeout(600 * 1000);
        // Create an upload handler
        let uploadHandler = this.provisionUploadHandler();
        // Return a promise that will process the uploaded file and send a result
        return new Promise((resolve, reject) => {
            // Receive any single file from the posted body in a field named 'file0'
            uploadHandler.single('file0')(request, response, err => {
                if (err) {
                    return reject(err);
                }
                // Detect if the file data was provided as a DataURL or an attached File
                if (request.body !== undefined && request.body.file0 !== undefined) {
                    // This file was provided as a DataURL
                    // Convert the DataURL into just the Base64 data
                    let imageBase64Data = request.body.file0.replace(/^data:[A-Za-z-+\/]+;base64,/, "");
                    // Store the uploaded file to secure storage
                    this.secureDocStorage.sendBase64DataToStorage(receiptID, imageBase64Data, true).then((storageHash) => {
                        // Retrieve the CaseEscortReceipt from the database
                        this.caseEscortReceiptRepository.findById(receiptID).then((caseEscortReceipt) => {
                            // Update the CaseEscortReceipt with details from SecureStorage
                            caseEscortReceipt.storageHash = storageHash;
                            caseEscortReceipt.createDate = (new Date()).toISOString();
                            // Store the updated CaseEscortReceipt in the database
                            this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                                resolve(caseEscortReceipt);
                            });
                        });
                    });
                }
                else if (request.file !== undefined && request.file.path !== undefined) {
                    // This file was provided as an attachment
                    // Store the uploaded file in secure storage
                    this.secureDocStorage.sendFileToStorage(receiptID, request.file.path, true).then((storageHash) => {
                        // Retrieve the CaseEscortReceipt from the database
                        this.caseEscortReceiptRepository.findById(receiptID).then((caseEscortReceipt) => {
                            // Update the CaseEscortReceipt with details from SecureStorage
                            caseEscortReceipt.storageHash = storageHash;
                            caseEscortReceipt.createDate = (new Date()).toISOString();
                            // Store the updated CaseEscortReceipt in the database
                            this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                                resolve(caseEscortReceipt);
                            });
                        });
                    });
                }
                else {
                    // No file was provided.  This is an ERROR condition
                    throw new rest_1.HttpErrors.BadRequest('No File was provided in the request, either as a DataURL or a file attachment.');
                }
            });
        });
    }
    async deleteCaseEscortReceiptFromSecureStorage(companyID, caseID, receiptID) {
        // Retrieve the CaseEscortReceipt from the database
        return this.caseEscortReceiptRepository.findById(receiptID).then((caseEscortReceipt) => {
            // Make sure this CaseEscortReceipt references a file in SecureStorage
            if (caseEscortReceipt.storageHash == null || caseEscortReceipt.storageHash == undefined) {
                //throw new Error('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null'));
                throw new rest_1.HttpErrors.InternalServerError('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null');
            }
            // Delete the stored file from secure storage
            return this.secureDocStorage.deleteDataFromStorage(caseEscortReceipt.receiptID, true);
        }).then((success) => {
            // Delete the CaseEscortReceipt from the database
            return this.caseEscortReceiptRepository.deleteById(receiptID);
        });
    }
    ensureEscortReceiptMatchesCaseID(caseEscortReceipt, caseID) {
        // Throw errors if the caseID's do not match
        if (caseEscortReceipt.caseID != caseID) {
            throw new rest_1.HttpErrors.BadRequest('CaseID provided in the request path does not match the CaseEscortReceipt caseID');
        }
    }
    provisionUploadHandler() {
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './uploadedFiles/');
            },
            filename: function (req, file, cb) {
                cb(null, Date.now() + '-' + file.originalname);
            }
        });
        const limits = {
            fields: 100,
            fileSize: 21000000,
            files: 1,
            parts: 210000,
            headerPairs: 100
        };
        return multer({ storage: storage, limits: limits });
    }
};
__decorate([
    rest_1.post('/companies/{companyID}/cases/{caseID}/escortReceipts', {
        responses: {
            '200': {
                description: 'CaseEscortReceipt model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseEscortReceipt } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CaseEscortReceipt]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "create", null);
__decorate([
    rest_1.post('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
        responses: {
            '200': {
                description: 'CaseEscortReceipt model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseEscortReceipt } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('receiptID')),
    __param(3, rest_1.requestBody({
        description: 'multipart/form-data value.',
        required: true,
        content: {
            'multipart/form-data': {
                'x-parser': 'stream',
                schema: { type: 'object' },
            },
        },
    })),
    __param(4, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "addCaseEscortReceiptToSecureStorage", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/escortReceipts', {
        responses: {
            '200': {
                description: 'Array of CaseEscortReceipt model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CaseEscortReceipt } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CaseEscortReceipt))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "find", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}', {
        responses: {
            '200': {
                description: 'CaseEscortReceipt model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseEscortReceipt } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('receiptID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "findById", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
        responses: {
            '200': {
                description: 'CaseEscortReceipt model instance',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('receiptID')),
    __param(3, rest_1.param.query.boolean('archivedCase')),
    __param(4, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "getCaseEscortReceiptFromSecureStorage", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}', {
        responses: {
            '204': {
                description: 'CaseEscortReceipt PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('receiptID')),
    __param(3, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, models_1.CaseEscortReceipt]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "updateById", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
        responses: {
            '204': {
                description: 'CaseEscortReceipt PATCH success',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseEscortReceipt } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('receiptID')),
    __param(3, rest_1.requestBody({
        description: 'multipart/form-data value.',
        required: true,
        content: {
            'multipart/form-data': {
                'x-parser': 'stream',
                schema: { type: 'object' },
            },
        },
    })),
    __param(4, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "updateCaseEscortReceiptInSecureStorage", null);
__decorate([
    rest_1.del('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
        responses: {
            '204': {
                description: 'CaseEscortReceipt DELETE success'
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('receiptID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CaseEscortReceiptsController.prototype, "deleteCaseEscortReceiptFromSecureStorage", null);
CaseEscortReceiptsController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, repository_1.repository(repositories_1.CompanyCaseRepository)),
    __param(2, repository_1.repository(repositories_1.CaseEscortReceiptRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.CompanyCaseRepository,
        repositories_1.CaseEscortReceiptRepository])
], CaseEscortReceiptsController);
exports.CaseEscortReceiptsController = CaseEscortReceiptsController;
//# sourceMappingURL=case-escort-receipts.controller.js.map