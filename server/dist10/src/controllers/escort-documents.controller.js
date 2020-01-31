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
let EscortDocumentsController = class EscortDocumentsController {
    constructor(user, escortRepository, escortDocumentRepository) {
        this.user = user;
        this.escortRepository = escortRepository;
        this.escortDocumentRepository = escortDocumentRepository;
        this.secureDocStorage = new secureDocStorage_1.SecureDocumentStorage();
    }
    async create(escortID, escortDocument) {
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
        // Create the new EscortDocument record in the database and return the result
        return await this.escortDocumentRepository.create(escortDocument);
    }
    async addEscortDocumentToSecureStorage(escortID, documentID, request, response) {
        // Extend the Request and Response timeouts
        request.setTimeout(600 * 1000, () => { });
        response.setTimeout(600 * 1000);
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
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
                        // Retrieve the EscortDocument from the database
                        this.escortDocumentRepository.findById(documentID).then((escortDocument) => {
                            // Update the EscortDocument with details from SecureStorage
                            escortDocument.storageHash = storageHash;
                            escortDocument.createDate = (new Date()).toISOString();
                            escortDocument.modifyDate = escortDocument.createDate;
                            // Store the updated EscortDocument in the database
                            this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                                resolve(escortDocument);
                            });
                        });
                    });
                }
                else if (request.file !== undefined && request.file.path !== undefined) {
                    // This file was provided as an attachment
                    // Store the uploaded file in secure storage
                    this.secureDocStorage.sendFileToStorage(documentID, request.file.path, true).then((storageHash) => {
                        // Retrieve the EscortDocument from the database
                        this.escortDocumentRepository.findById(documentID).then((escortDocument) => {
                            // Update the EscortDocument with details from SecureStorage
                            escortDocument.storageHash = storageHash;
                            escortDocument.createDate = (new Date()).toISOString();
                            escortDocument.modifyDate = escortDocument.createDate;
                            // Store the updated EscortDocument in the database
                            this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                                resolve(escortDocument);
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
    async find(escortID, filter) {
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
        return await this.escortDocumentRepository.find(filter);
    }
    async findById(escortID, documentID) {
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
        return await this.escortDocumentRepository.findById(documentID);
    }
    async getEscortDocumentFromSecureStorage(escortID, documentID, response) {
        // Extend the Response timeouts
        response.setTimeout(600 * 1000);
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
        // Return a promise that will send the stored file
        return new Promise((resolve, reject) => {
            // Retrieve the EscortDocument from the database
            this.escortDocumentRepository.findById(documentID).then((escortDocument) => {
                // Make sure this EscortDocument references a file in SecureStorage
                if (escortDocument.storageHash == null || escortDocument.storageHash == undefined) {
                    reject(new Error('Escort Document does not reference a file in SecureStorage.  StorageHash is null'));
                    return false;
                }
                // Retrieve the stored file from secure storage
                this.secureDocStorage.retrieveBinaryDataFromStorage(escortDocument.documentID, escortDocument.storageHash, true).then((documentFile) => {
                    // Attach the returned file to the Response
                    response.attachment(escortDocument.name);
                    response.contentType(mimeTypeResolver_1.MimeTypeResolver.resolveMimeType(escortDocument.name));
                    response.send(documentFile);
                    return true;
                });
            });
        });
    }
    async updateById(escortID, documentID, escortDocument) {
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
        await this.escortDocumentRepository.updateById(documentID, escortDocument);
    }
    async updateEscortDocumentInSecureStorage(escortID, documentID, request, response) {
        // Extend the Request and Response timeouts
        request.setTimeout(600 * 1000, () => { });
        response.setTimeout(600 * 1000);
        // Ensure the requesting user is permitted to do this operation
        await this.ensureJWTMatchesEscortID(this.user.id, escortID);
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
                        // Retrieve the EscortDocument from the database
                        this.escortDocumentRepository.findById(documentID).then((escortDocument) => {
                            // Update the EscortDocument with details from SecureStorage
                            escortDocument.storageHash = storageHash;
                            escortDocument.createDate = (new Date()).toISOString();
                            escortDocument.modifyDate = escortDocument.createDate;
                            // Store the updated EscortDocument in the database
                            this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                                resolve(escortDocument);
                            });
                        });
                    });
                }
                else if (request.file !== undefined && request.file.path !== undefined) {
                    // This file was provided as an attachment
                    // Store the uploaded file in secure storage
                    this.secureDocStorage.sendFileToStorage(documentID, request.file.path, true).then((storageHash) => {
                        // Retrieve the EscortDocument from the database
                        this.escortDocumentRepository.findById(documentID).then((escortDocument) => {
                            // Update the EscortDocument with details from SecureStorage
                            escortDocument.storageHash = storageHash;
                            escortDocument.createDate = (new Date()).toISOString();
                            escortDocument.modifyDate = escortDocument.createDate;
                            // Store the updated EscortDocument in the database
                            this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                                resolve(escortDocument);
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
    async ensureJWTMatchesEscortID(userID, escortID) {
        // Retrieve the Escort record from the database
        let escort = await this.escortRepository.findById(escortID);
        // Throw errors if the userID's do not match
        if (escort.userID != userID) {
            throw new rest_1.HttpErrors.Unauthorized('JWT User is not permitted to access this Escort data');
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
    rest_1.post('/escorts/{escortID}/documents', {
        responses: {
            '200': {
                description: 'EscortDocument model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.EscortDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, models_1.EscortDocument]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "create", null);
__decorate([
    rest_1.post('/escorts/{escortID}/documents/{documentID}/file', {
        responses: {
            '200': {
                description: 'EscortDocument model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.EscortDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.param.path.string('documentID')),
    __param(2, rest_1.requestBody({
        description: 'multipart/form-data value.',
        required: true,
        content: {
            'multipart/form-data': {
                'x-parser': 'stream',
                schema: { type: 'object' },
            },
        },
    })),
    __param(3, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "addEscortDocumentToSecureStorage", null);
__decorate([
    rest_1.get('/escorts/{escortID}/documents', {
        responses: {
            '200': {
                description: 'Array of EscortDocument model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.EscortDocument } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.EscortDocument))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "find", null);
__decorate([
    rest_1.get('/escorts/{escortID}/documents/{documentID}', {
        responses: {
            '200': {
                description: 'EscortDocument model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.EscortDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.param.path.string('documentID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "findById", null);
__decorate([
    rest_1.get('/escorts/{escortID}/documents/{documentID}/file', {
        responses: {
            '200': {
                description: 'EscortDocument model instance',
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
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.param.path.string('documentID')),
    __param(2, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "getEscortDocumentFromSecureStorage", null);
__decorate([
    rest_1.patch('/escorts/{escortID}/documents/{documentID}', {
        responses: {
            '204': {
                description: 'EscortDocument PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.param.path.string('documentID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.EscortDocument]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "updateById", null);
__decorate([
    rest_1.patch('/escorts/{escortID}/documents/{documentID}/file', {
        responses: {
            '204': {
                description: 'EscortDocument PATCH success',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.EscortDocument } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('escortID')),
    __param(1, rest_1.param.path.string('documentID')),
    __param(2, rest_1.requestBody({
        description: 'multipart/form-data value.',
        required: true,
        content: {
            'multipart/form-data': {
                'x-parser': 'stream',
                schema: { type: 'object' },
            },
        },
    })),
    __param(3, context_1.inject(rest_1.RestBindings.Http.RESPONSE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], EscortDocumentsController.prototype, "updateEscortDocumentInSecureStorage", null);
EscortDocumentsController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, repository_1.repository(repositories_1.EscortRepository)),
    __param(2, repository_1.repository(repositories_1.EscortDocumentRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.EscortRepository,
        repositories_1.EscortDocumentRepository])
], EscortDocumentsController);
exports.EscortDocumentsController = EscortDocumentsController;
//# sourceMappingURL=escort-documents.controller.js.map