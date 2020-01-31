import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  del,
  requestBody,
  HttpErrors,
  RestBindings,
} from '@loopback/rest';
import { inject } from '@loopback/context';
import { Request, Response } from "express-serve-static-core";
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';
import { EscortDocument, Escort } from '../models';
import { EscortDocumentRepository, EscortRepository } from '../repositories';
import { SecureDocumentStorage } from '../helpers/secureDocStorage';
import { MimeTypeResolver } from '../helpers/mimeTypeResolver';
import { decode } from 'jwt-simple';

import * as multer from 'multer';
const uuid62 = require('uuid62');


const FORM_DATA = 'multipart/form-data';


export class EscortDocumentsController {

  private secureDocStorage : SecureDocumentStorage = new SecureDocumentStorage();


  constructor(
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
    @repository(EscortRepository)           public escortRepository : EscortRepository,
    @repository(EscortDocumentRepository)   public escortDocumentRepository : EscortDocumentRepository,
  ) {}



  @post('/escorts/{escortID}/documents', {
    responses: {
      '200': {
        description: 'EscortDocument model instance',
        content: {'application/json': {schema: {'x-ts-type': EscortDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(
    @param.path.string('escortID') escortID: string,
    @requestBody() escortDocument: EscortDocument
  ): Promise<EscortDocument> {

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);

    // Create the new EscortDocument record in the database and return the result
    return await this.escortDocumentRepository.create(escortDocument);
  }



  @post('/escorts/{escortID}/documents/{documentID}/file', {
    responses: {
      '200': {
        description: 'EscortDocument model instance',
        content: {'application/json': {schema: {'x-ts-type': EscortDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async addEscortDocumentToSecureStorage(
    @param.path.string('escortID') escortID: string,
    @param.path.string('documentID') documentID: string,
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {type: 'object'},
        },
      },
    }) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<EscortDocument> {

    // Extend the Request and Response timeouts
    request.setTimeout(600 * 1000, ()=>{});
    response.setTimeout(600 * 1000);

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);
    
    // Create an upload handler
    let uploadHandler : multer.Instance = this.provisionUploadHandler();

    // Return a promise that will process the uploaded file and send a result
    return new Promise<EscortDocument>((resolve, reject) => {
      // Receive any single file from the posted body in a field named 'file0'
      uploadHandler.single('file0')(request, response, err => {
        if (err) { return reject(err); }

        // Detect if the file data was provided as a DataURL or an attached File
        if (request.body !== undefined && request.body.file0 !== undefined) {
          // This file was provided as a DataURL

          // Convert the DataURL into just the Base64 data
          let imageBase64Data : string = request.body.file0.replace(/^data:[A-Za-z-+\/]+;base64,/, "");

          // Store the uploaded file to secure storage
          this.secureDocStorage.sendBase64DataToStorage(documentID, imageBase64Data, true).then(
            (storageHash:string) => {

              // Retrieve the EscortDocument from the database
              this.escortDocumentRepository.findById(documentID).then(
                (escortDocument: EscortDocument) => {
                  // Update the EscortDocument with details from SecureStorage
                  escortDocument.storageHash = storageHash;
                  escortDocument.createDate = (new Date()).toISOString();
                  escortDocument.modifyDate = escortDocument.createDate;

                  // Store the updated EscortDocument in the database
                  this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                    resolve(escortDocument);
                  });
                }
              );
            }
          );
        } else if (request.file !== undefined && request.file.path !== undefined) {
          // This file was provided as an attachment

          // Store the uploaded file in secure storage
          this.secureDocStorage.sendFileToStorage(documentID, request.file.path, true).then(
            (storageHash:string) => {

              // Retrieve the EscortDocument from the database
              this.escortDocumentRepository.findById(documentID).then(
                (escortDocument: EscortDocument) => {
                  // Update the EscortDocument with details from SecureStorage
                  escortDocument.storageHash = storageHash;
                  escortDocument.createDate = (new Date()).toISOString();
                  escortDocument.modifyDate = escortDocument.createDate;

                  // Store the updated EscortDocument in the database
                  this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                    resolve(escortDocument);
                  });
                }
              );
            }
          );
        
        } else {
          // No file was provided.  This is an ERROR condition
          throw new HttpErrors.BadRequest('No File was provided in the request, either as a DataURL or a file attachment.');
        }

      });
    });
  }


  @get('/escorts/{escortID}/documents', {
    responses: {
      '200': {
        description: 'Array of EscortDocument model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': EscortDocument}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.path.string('escortID') escortID: string,
    @param.query.object('filter', getFilterSchemaFor(EscortDocument)) filter?: Filter,
  ): Promise<EscortDocument[]> {

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);

    return await this.escortDocumentRepository.find(filter);
  }


  @get('/escorts/{escortID}/documents/{documentID}', {
    responses: {
      '200': {
        description: 'EscortDocument model instance',
        content: {'application/json': {schema: {'x-ts-type': EscortDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async findById(
    @param.path.string('escortID') escortID: string,
    @param.path.string('documentID') documentID: string
  ): Promise<EscortDocument> {

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);

    return await this.escortDocumentRepository.findById(documentID);
  }


  @get('/escorts/{escortID}/documents/{documentID}/file', {
    responses: {
      '200': {
        description: 'EscortDocument model instance',
        content:{
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async getEscortDocumentFromSecureStorage(
    @param.path.string('escortID') escortID: string,
    @param.path.string('documentID') documentID: string,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<boolean> {

    // Extend the Response timeouts
    response.setTimeout(600 * 1000);

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);
    
    // Return a promise that will send the stored file
    return new Promise<boolean>((resolve, reject) => {

      // Retrieve the EscortDocument from the database
      this.escortDocumentRepository.findById(documentID).then(
        (escortDocument: EscortDocument) => {

          // Make sure this EscortDocument references a file in SecureStorage
          if (escortDocument.storageHash == null || escortDocument.storageHash == undefined) {
            reject(new Error('Escort Document does not reference a file in SecureStorage.  StorageHash is null'));
            return false;
          }

          // Retrieve the stored file from secure storage
          this.secureDocStorage.retrieveBinaryDataFromStorage(escortDocument.documentID, escortDocument.storageHash, true).then(
            (documentFile:Buffer) => {

              // Attach the returned file to the Response
              response.attachment(escortDocument.name);
              response.contentType(MimeTypeResolver.resolveMimeType(escortDocument.name));
              response.send(documentFile);
              return true;
            }
          );
        }
      );
    });
  }



  @patch('/escorts/{escortID}/documents/{documentID}', {
    responses: {
      '204': {
        description: 'EscortDocument PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(
    @param.path.string('escortID') escortID: string,
    @param.path.string('documentID') documentID: string,
    @requestBody() escortDocument: EscortDocument,
  ): Promise<void> {

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);

    await this.escortDocumentRepository.updateById(documentID, escortDocument);
  }


  @patch('/escorts/{escortID}/documents/{documentID}/file', {
    responses: {
      '204': {
        description: 'EscortDocument PATCH success',
        content: {'application/json': {schema: {'x-ts-type': EscortDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateEscortDocumentInSecureStorage(
    @param.path.string('escortID') escortID: string,
    @param.path.string('documentID') documentID: string,
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {type: 'object'},
        },
      },
    }) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<EscortDocument> {

    // Extend the Request and Response timeouts
    request.setTimeout(600 * 1000, ()=>{});
    response.setTimeout(600 * 1000);

    // Ensure the requesting user is permitted to do this operation
    await this.ensureJWTMatchesEscortID(this.user.id, escortID);
    
    // Create an upload handler
    let uploadHandler : multer.Instance = this.provisionUploadHandler();

    // Return a promise that will process the uploaded file and send a result
    return new Promise<EscortDocument>((resolve, reject) => {
      // Receive any single file from the posted body in a field named 'file0'
      uploadHandler.single('file0')(request, response, err => {
        if (err) { return reject(err); }

        // Detect if the file data was provided as a DataURL or an attached File
        if (request.body !== undefined && request.body.file0 !== undefined) {
          // This file was provided as a DataURL

          // Convert the DataURL into just the Base64 data
          let imageBase64Data : string = request.body.file0.replace(/^data:[A-Za-z-+\/]+;base64,/, "");

          // Store the uploaded file to secure storage
          this.secureDocStorage.sendBase64DataToStorage(documentID, imageBase64Data, true).then(
            (storageHash:string) => {

              // Retrieve the EscortDocument from the database
              this.escortDocumentRepository.findById(documentID).then(
                (escortDocument: EscortDocument) => {
                  // Update the EscortDocument with details from SecureStorage
                  escortDocument.storageHash = storageHash;
                  escortDocument.createDate = (new Date()).toISOString();
                  escortDocument.modifyDate = escortDocument.createDate;

                  // Store the updated EscortDocument in the database
                  this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                    resolve(escortDocument);
                  });
                }
              );
            }
          );
        } else if (request.file !== undefined && request.file.path !== undefined) {
          // This file was provided as an attachment

          // Store the uploaded file in secure storage
          this.secureDocStorage.sendFileToStorage(documentID, request.file.path, true).then(
            (storageHash:string) => {

              // Retrieve the EscortDocument from the database
              this.escortDocumentRepository.findById(documentID).then(
                (escortDocument: EscortDocument) => {
                  // Update the EscortDocument with details from SecureStorage
                  escortDocument.storageHash = storageHash;
                  escortDocument.createDate = (new Date()).toISOString();
                  escortDocument.modifyDate = escortDocument.createDate;

                  // Store the updated EscortDocument in the database
                  this.escortDocumentRepository.updateById(documentID, escortDocument).then(() => {
                    resolve(escortDocument);
                  });
                }
              );
            }
          );
        
        } else {
          // No file was provided.  This is an ERROR condition
          throw new HttpErrors.BadRequest('No File was provided in the request, either as a DataURL or a file attachment.');
        }

      });
    });
  }




  async ensureJWTMatchesEscortID(userID : string, escortID : string) : Promise<void> {
    // Retrieve the Escort record from the database
    let escort : Escort = await this.escortRepository.findById(escortID);

    // Throw errors if the userID's do not match
    if (escort.userID != userID) {
      throw new HttpErrors.Unauthorized('JWT User is not permitted to access this Escort data');
    }
  }

  provisionUploadHandler() : multer.Instance {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './uploadedFiles/')
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
      }
    });

    const limits : any = {
      fields: 100,
      fileSize: 21000000,
      files: 1,
      parts: 210000,
      headerPairs: 100
    };
    
    return multer({ storage: storage, limits: limits });
  }

}
