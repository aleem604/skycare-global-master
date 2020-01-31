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
import { CaseDocument, CompanyCase } from '../models';
import { CaseDocumentRepository, CompanyCaseRepository } from '../repositories';
import { SecureDocumentStorage } from '../helpers/secureDocStorage';
import { MimeTypeResolver } from '../helpers/mimeTypeResolver';
import { decode } from 'jwt-simple';

import * as multer from 'multer';
const uuid62 = require('uuid62');


const FORM_DATA = 'multipart/form-data';



export class CaseDocumentsController {

  private secureDocStorage : SecureDocumentStorage = new SecureDocumentStorage();

  constructor(
    @inject(AuthenticationBindings.CURRENT_USER)  private user: UserProfile,
    @repository(CompanyCaseRepository)            public caseRepository : CompanyCaseRepository,
    @repository(CaseDocumentRepository)           public caseDocumentRepository : CaseDocumentRepository,
  ) {}



  @post('/companies/{companyID}/cases/{caseID}/documents', {
    responses: {
      '200': {
        description: 'CaseDocument model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() caseDocument: CaseDocument
  ): Promise<CaseDocument> {

    // Ensure the CaseDocument matches the caseID in the path
    this.ensureDocumentMatchesCaseID(caseDocument, caseID);

    // Create the new CaseDocument record in the database and return the result
    return await this.caseDocumentRepository.create(caseDocument);
  }



  @post('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
    responses: {
      '200': {
        description: 'CaseDocument model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async addCaseDocumentToSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
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
  ): Promise<CaseDocument> {

    // Extend the Request and Response timeouts
    request.setTimeout(600 * 1000, ()=>{});
    response.setTimeout(600 * 1000);

    // Create an upload handler
    let uploadHandler : multer.Instance = this.provisionUploadHandler();

    // Return a promise that will process the uploaded file and send a result
    return new Promise<CaseDocument>((resolve, reject) => {
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

              // Retrieve the CaseDocument from the database
              this.caseDocumentRepository.findById(documentID).then(
                (caseDocument: CaseDocument) => {
                  // Update the CaseDocument with details from SecureStorage
                  caseDocument.storageHash = storageHash;
                  caseDocument.createDate = (new Date()).toISOString();
                  caseDocument.modifyDate = caseDocument.createDate;

                  // Store the updated CaseDocument in the database
                  this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                    resolve(caseDocument);
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

              // Retrieve the CaseDocument from the database
              this.caseDocumentRepository.findById(documentID).then(
                (caseDocument: CaseDocument) => {
                  // Update the CaseDocument with details from SecureStorage
                  caseDocument.storageHash = storageHash;
                  caseDocument.createDate = (new Date()).toISOString();
                  caseDocument.modifyDate = caseDocument.createDate;

                  // Store the updated CaseDocument in the database
                  this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                    resolve(caseDocument);
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


  @get('/companies/{companyID}/cases/{caseID}/documents', {
    responses: {
      '200': {
        description: 'Array of CaseDocument model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CaseDocument}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.query.object('filter', getFilterSchemaFor(CaseDocument)) filter?: Filter,
  ): Promise<CaseDocument[]> {
    if (filter === undefined) {
      filter = { where : { caseID : caseID} };
    }
    return await this.caseDocumentRepository.find(filter);
  }


  @get('/companies/{companyID}/cases/{caseID}/documents/{documentID}', {
    responses: {
      '200': {
        description: 'CaseDocument model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async findById(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('documentID') documentID: string
  ): Promise<CaseDocument> {
    return await this.caseDocumentRepository.findById(documentID);
  }


  @get('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
    responses: {
      '200': {
        description: 'CaseDocument model instance',
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
  async getCaseDocumentFromSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('documentID') documentID: string,
    @param.query.boolean('archivedCase') archivedCase: boolean = false,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<boolean> {

    // Extend the Response timeouts
    response.setTimeout(600 * 1000);
    
    // Return a promise that will send the stored file
    return new Promise<boolean>((resolve, reject) => {

      if (archivedCase) {
        // Retrieve the CaseDocument from the database
        this.caseRepository.findById(caseID).then(
          (currentCase: CompanyCase) => {
            let caseDocument : CaseDocument = currentCase.documents.filter((v,i,l)=>{ return v.documentID==documentID;})[0];

            // Make sure this CaseDocument references a file in SecureStorage
            if (caseDocument.storageHash == null || caseDocument.storageHash == undefined) {
              reject(new Error('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null'));
              return false;
            }

            // Retrieve the stored file from secure storage
            this.secureDocStorage.retrieveBinaryDataFromStorage(caseDocument.documentID, caseDocument.storageHash, true).then(
              (documentFile:Buffer) => {

                // Attach the returned file to the Response
                response.attachment(caseDocument.name);
                response.contentType(MimeTypeResolver.resolveMimeType(caseDocument.name));
                response.send(documentFile);
                return true;
              }
            );
          }
        );
      } else {
        // Retrieve the CaseDocument from the database
        this.caseDocumentRepository.findById(documentID).then(
          (caseDocument: CaseDocument) => {

            // Make sure this CaseDocument references a file in SecureStorage
            if (caseDocument.storageHash == null || caseDocument.storageHash == undefined) {
              reject(new Error('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null'));
              return false;
            }

            // Retrieve the stored file from secure storage
            this.secureDocStorage.retrieveBinaryDataFromStorage(caseDocument.documentID, caseDocument.storageHash, true).then(
              (documentFile:Buffer) => {

                // Attach the returned file to the Response
                response.attachment(caseDocument.name);
                response.contentType(MimeTypeResolver.resolveMimeType(caseDocument.name));
                response.send(documentFile);
                return true;
              }
            );
          }
        );
      }
    });
  }



  @patch('/companies/{companyID}/cases/{caseID}/documents/{documentID}', {
    responses: {
      '204': {
        description: 'CaseDocument PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('documentID') documentID: string,
    @requestBody() caseDocument: CaseDocument,
  ): Promise<void> {

    // Ensure the CaseDocument matches the caseID in the path
    this.ensureDocumentMatchesCaseID(caseDocument, caseID);

    await this.caseDocumentRepository.updateById(documentID, caseDocument);
  }


  @patch('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
    responses: {
      '204': {
        description: 'CaseDocument PATCH success',
        content: {'application/json': {schema: {'x-ts-type': CaseDocument}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateCaseDocumentInSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
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
  ): Promise<CaseDocument> {

    // Extend the Request and Response timeouts
    request.setTimeout(600 * 1000, ()=>{});
    response.setTimeout(600 * 1000);
    
    // Create an upload handler
    let uploadHandler : multer.Instance = this.provisionUploadHandler();

    // Return a promise that will process the uploaded file and send a result
    return new Promise<CaseDocument>((resolve, reject) => {
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

              // Retrieve the CaseDocument from the database
              this.caseDocumentRepository.findById(documentID).then(
                (caseDocument: CaseDocument) => {
                  // Update the CaseDocument with details from SecureStorage
                  caseDocument.storageHash = storageHash;
                  caseDocument.createDate = (new Date()).toISOString();
                  caseDocument.modifyDate = caseDocument.createDate;

                  // Store the updated CaseDocument in the database
                  this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                    resolve(caseDocument);
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

              // Retrieve the CaseDocument from the database
              this.caseDocumentRepository.findById(documentID).then(
                (caseDocument: CaseDocument) => {
                  // Update the CaseDocument with details from SecureStorage
                  caseDocument.storageHash = storageHash;
                  caseDocument.createDate = (new Date()).toISOString();
                  caseDocument.modifyDate = caseDocument.createDate;

                  // Store the updated CaseDocument in the database
                  this.caseDocumentRepository.updateById(documentID, caseDocument).then(() => {
                    resolve(caseDocument);
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


  @del('/companies/{companyID}/cases/{caseID}/documents/{documentID}/file', {
    responses: {
      '204': {
        description: 'CaseDocument DELETE success'
      },
    },
  })
  @authenticate('JWTStrategy')
  async deleteCaseDocumentFromSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('documentID') documentID: string,
  ): Promise<void> {    

    // Retrieve the CaseDocument from the database
    return this.caseDocumentRepository.findById(documentID).then(
      (caseDocument: CaseDocument) => {
        // Make sure this CaseDocument references a file in SecureStorage
        if (caseDocument.storageHash == null || caseDocument.storageHash == undefined) {
          //throw new Error('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null'));
          throw new HttpErrors.InternalServerError('CompanyCase Document does not reference a file in SecureStorage.  StorageHash is null');
        }

        // Delete the stored file from secure storage
        return this.secureDocStorage.deleteDataFromStorage(caseDocument.documentID, true);
      }).then( (success: boolean) => {
        // Delete the CaseDocument from the database
        return this.caseDocumentRepository.deleteById(documentID)
      }
    );

  }



  ensureDocumentMatchesCaseID(caseDocument : CaseDocument, caseID : string) : void {
    // Throw errors if the caseID's do not match
    if (caseDocument.caseID != caseID) {
      throw new HttpErrors.BadRequest('CaseID provided in the request path does not match the CaseDocument caseID');
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
