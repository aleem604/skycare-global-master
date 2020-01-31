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
let CaseDocumentsController = class CaseDocumentsController {
    constructor(user, caseRepository, caseDocumentRepository) {
        this.user = user;
        this.caseRepository = caseRepository;
        this.caseDocumentRepository = caseDocumentRepository;
        this.secureDocStorage = new secureDocStorage_1.SecureDocumentStorage();
    }
    async create(companyID, caseID, caseDocument) {
        // Ensure the CaseDocument matches the caseID in the path
        this.ensureDocumentMatchesCaseID(caseDocument, caseID);
        // Create the new CaseDocument record in the database and return the result
        return await this.caseDocumentRepository.create(caseDocument);
    }
    async addCaseDocumentToSecureStorage(companyID, caseID, documentID, request, response) {
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
                    this.secureDocStorage.sendBase64DataToStorage(documentID, imageBase64Data, true).then((storageHash) => {
                        // Retrieve the CaseDocument from the database
                        this.caseDocumentRepository.findById(documentID).then((caseDocument) => {
                            // Update the CaseDocument with details from SecureStorage
                            caseDocument.storageHash = storageHash;
                            caseDocument.createDate = (new Date()).toISOString();
                            caseDocument.modifyDate = caseDocument.createDate;
                            // Store the updated CaseDocument in the database
                            this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                                resolve(caseDocument);
                            });
                        });
                    });
                }
                else if (request.file !== undefined && request.file.path !== undefined) {
                    // This file was provided as an attachment
                    // Store the uploaded file in secure storage
                    this.secureDocStorage.sendFileToStorage(documentID, request.file.path, true).then((storageHash) => {
                        // Retrieve the CaseDocument from the database
                        this.caseDocumentRepository.findById(documentID).then((caseDocument) => {
                            // Update the CaseDocument with details from SecureStorage
                            caseDocument.storageHash = storageHash;
                            caseDocument.createDate = (new Date()).toISOString();
                            caseDocument.modifyDate = caseDocument.createDate;
                            // Store the updated CaseDocument in the database
                            this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                                resolve(caseDocument);
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
        return await this.caseDocumentRepository.find(filter);
    }
    async findById(companyID, caseID, documentID) {
        return await this.caseDocumentRepository.findById(documentID);
    }
    async getCaseDocumentFromSecureStorage(companyID, caseID, documentID, archivedCase = false, response) {
        // Extend the Response timeouts
        response.setTimeout(600 * 1000);
        // Return a promise that will send the stored file
        return new Promise((resolve, reject) => {
            if (archivedCase) {
                // Retrieve the CaseDocument from the database
                this.caseRepository.findById(caseID).then((currentCase) => {
                    let caseDocument = currentCase.documents.filter((v, i, l) => { return v.documentID == documentID; })[0];
                    // Make sure this CaseDocument references a file in SecureStorage
                    if (caseDocument.storageHash == null || caseDocument.storageHash == undefined) {
                        reject(new Error('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null'));
                        return false;
                    }
                    // Retrieve the stored file from secure storage
                    this.secureDocStorage.retrieveBinaryDataFromStorage(caseDocument.documentID, caseDocument.storageHash, true).then((documentFile) => {
                        // Attach the returned file to the Response
                        response.attachment(caseDocument.name);
                        response.contentType(mimeTypeResolver_1.MimeTypeResolver.resolveMimeType(caseDocument.name));
                        response.send(documentFile);
                        return true;
                    });
                });
            }
            else {
                // Retrieve the CaseDocument from the database
                this.caseDocumentRepository.findById(documentID).then((caseDocument) => {
                    // Make sure this CaseDocument references a file in SecureStorage
                    if (caseDocument.storageHash == null || caseDocument.storageHash == undefined) {
                        reject(new Error('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null'));
                        return false;
                    }
                    // Retrieve the stored file from secure storage
                    this.secureDocStorage.retrieveBinaryDataFromStorage(caseDocument.documentID, caseDocument.storageHash, true).then((documentFile) => {
                        // Attach the returned file to the Response
                        response.attachment(caseDocument.name);
                        response.contentType(mimeTypeResolver_1.MimeTypeResolver.resolveMimeType(caseDocument.name));
                        response.send(documentFile);
                        return true;
                    });
                });
            }
        });
    }
    async updateById(companyID, caseID, documentID, caseDocument) {
        // Ensure the CaseDocument matches the caseID in the path
        this.ensureDocumentMatchesCaseID(caseDocument, caseID);
        await this.caseDocumentRepository.updateById(documentID, caseDocument);
    }
    async updateCaseDocumentInSecureStorage(companyID, caseID, documentID, request, response) {
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
                    this.secureDocStorage.sendBase64DataToStorage(documentID, imageBase64Data, true).then((storageHash) => {
                        // Retrieve the CaseDocument from the database
                        this.caseDocumentRepository.findById(documentID).then((caseDocument) => {
                            // Update the CaseDocument with details from SecureStorage
                            caseDocument.storageHash = storageHash;
                            caseDocument.createDate = (new Date()).toISOString();
                            caseDocument.modifyDate = caseDocument.createDate;
                            // Store the updated CaseDocument in the database
                            this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                                resolve(caseDocument);
                            });
                        });
                    });
                }
                else if (request.file !== undefined && request.file.path !== undefined) {
                    // This file was provided as an attachment
                    // Store the uploaded file in secure storage
                    this.secureDocStorage.sendFileToStorage(documentID, request.file.path, true).then((storageHash) => {
                        // Retrieve the CaseDocument from the database
                        this.caseDocumentRepository.findById(documentID).then((caseDocument) => {
                            // Update the CaseDocument with details from SecureStorage
                            caseDocument.storageHash = storageHash;
                            caseDocument.createDate = (new Date()).toISOString();
                            caseDocument.modifyDate = caseDocument.createDate;
                            // Store the updated CaseDocument in the database
                            this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                                resolve(caseDocument);
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
    async deleteCaseDocumentFromSecureStorage(companyID, caseID, documentID) {
        // Retrieve the CaseDocument from the database
        return this.caseDocumentRepository.findById(documentID).then((caseDocument) => {
            // Make sure this CaseDocument references a file in SecureStorage
            if (caseDocument.storageHash == null || caseDocument.storageHash == undefined) {
                //throw new Error('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null'));
                throw new rest_1.HttpErrors.InternalServerError('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null');
            }
            // Delete the stored file from secure storage
            return this.secureDocStorage.deleteDataFromStorage(caseDocument.documentID, true);
        }).then((success) => {
            // Delete the CaseDocument from the database
            return this.caseDocumentRepository.deleteById(documentID);
        });
    }
    ensureDocumentMatchesCaseID(caseDocument, caseID) {
        // Throw errors if the caseID's do not match
        if (caseDocument.caseID != caseID) {
            throw new rest_1.HttpErrors.BadRequest('CaseID provided in the request path does not match the CaseDocument caseID');
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
    rest_1.post('/companies/{companyID}/cases/{caseID}/documents', {
        responses: {
            '200': {
                description: 'CaseDocument model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CaseDocument]),
    __metadata("design:returntype", Promise)
], CaseDocumentsController.prototype, "create", null);
__decorate([
    rest_1.post('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
        responses: {
            '200': {
                description: 'CaseDocument model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('documentID')),
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
], CaseDocumentsController.prototype, "addCaseDocumentToSecureStorage", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/documents', {
        responses: {
            '200': {
                description: 'Array of CaseDocument model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CaseDocument } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CaseDocument))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CaseDocumentsController.prototype, "find", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/documents/{documentID}', {
        responses: {
            '200': {
                description: 'CaseDocument model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('documentID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CaseDocumentsController.prototype, "findById", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
        responses: {
            '200': {
                description: 'CaseDocument model instance',
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
    __param(2, rest_1.param.path.string('documentID')),
    __param(3, rest_1.param.query.boolean('archivedCase')),
    __param(4, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], CaseDocumentsController.prototype, "getCaseDocumentFromSecureStorage", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}/documents/{documentID}', {
        responses: {
            '204': {
                description: 'CaseDocument PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('documentID')),
    __param(3, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, models_1.CaseDocument]),
    __metadata("design:returntype", Promise)
], CaseDocumentsController.prototype, "updateById", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
        responses: {
            '204': {
                description: 'CaseDocument PATCH success',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CaseDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('documentID')),
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
], CaseDocumentsController.prototype, "updateCaseDocumentInSecureStorage", null);
__decorate([
    rest_1.del('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
        responses: {
            '204': {
                description: 'CaseDocument DELETE success'
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.path.string('documentID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CaseDocumentsController.prototype, "deleteCaseDocumentFromSecureStorage", null);
CaseDocumentsController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, repository_1.repository(repositories_1.CompanyCaseRepository)),
    __param(2, repository_1.repository(repositories_1.CaseDocumentRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.CompanyCaseRepository,
        repositories_1.CaseDocumentRepository])
], CaseDocumentsController);
exports.CaseDocumentsController = CaseDocumentsController;
//# sourceMappingURL=case-documents.controller.js.map