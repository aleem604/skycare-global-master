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
  RestBindings
} from '@loopback/rest';
import { inject } from '@loopback/context';
import { Request, Response } from "express-serve-static-core";
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';
import { CaseEscortReceipt, CompanyCase } from '../models';
import { CaseEscortReceiptRepository, CompanyCaseRepository } from '../repositories';
import { SecureDocumentStorage } from '../helpers/secureDocStorage';
import { MimeTypeResolver } from '../helpers/mimeTypeResolver';
import { decode } from 'jwt-simple';

import * as multer from 'multer';
const uuid62 = require('uuid62');


const FORM_DATA = 'multipart/form-data';



export class CaseEscortReceiptsController {

  private secureDocStorage : SecureDocumentStorage = new SecureDocumentStorage();

  constructor(
    @inject(AuthenticationBindings.CURRENT_USER)  private user: UserProfile,
    @repository(CompanyCaseRepository)            public caseRepository : CompanyCaseRepository,
    @repository(CaseEscortReceiptRepository)      public caseEscortReceiptRepository : CaseEscortReceiptRepository,
  ) {}



  @post('/companies/{companyID}/cases/{caseID}/escortReceipts', {
    responses: {
      '200': {
        description: 'CaseEscortReceipt model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseEscortReceipt}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() caseEscortReceipt: CaseEscortReceipt
  ): Promise<CaseEscortReceipt> {

    // Ensure the CaseEscortReceipt matches the caseID in the path
    this.ensureEscortReceiptMatchesCaseID(caseEscortReceipt, caseID);

    // Create the new CaseEscortReceipt record in the database and return the result
    return await this.caseEscortReceiptRepository.create(caseEscortReceipt);
  }



  @post('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
    responses: {
      '200': {
        description: 'CaseEscortReceipt model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseEscortReceipt}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async addCaseEscortReceiptToSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('receiptID') receiptID: string,
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
  ): Promise<CaseEscortReceipt> {

    // Extend the Request and Response timeouts
    request.setTimeout(600 * 1000, ()=>{});
    response.setTimeout(600 * 1000);

    // Create an upload handler
    let uploadHandler : multer.Instance = this.provisionUploadHandler();

    // Return a promise that will process the uploaded file and send a result
    return new Promise<CaseEscortReceipt>((resolve, reject) => {
      // Receive any single file from the posted body in a field named 'file0'
      uploadHandler.single('file0')(request, response, err => {
        if (err) { return reject(err); }

        // Detect if the file data was provided as a DataURL or an attached File
        if (request.body !== undefined && request.body.file0 !== undefined) {
          // This file was provided as a DataURL

          // Convert the DataURL into just the Base64 data
          let imageBase64Data : string = request.body.file0.replace(/^data:[A-Za-z-+\/]+;base64,/, "");

          // Store the uploaded file to secure storage
          this.secureDocStorage.sendBase64DataToStorage(receiptID, imageBase64Data, true).then(
            (storageHash:string) => {

              // Retrieve the CaseEscortReceipt from the database
              this.caseEscortReceiptRepository.findById(receiptID).then(
                (caseEscortReceipt: CaseEscortReceipt) => {
                  // Update the CaseEscortReceipt with details from SecureStorage
                  caseEscortReceipt.storageHash = storageHash;
                  caseEscortReceipt.createDate = (new Date()).toISOString();

                  // Store the updated CaseEscortReceipt in the database
                  this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                    resolve(caseEscortReceipt);
                  });
                }
              );
            }
          );
        } else if (request.file !== undefined && request.file.path !== undefined) {
          // This file was provided as an attachment

          // Store the uploaded file in secure storage
          this.secureDocStorage.sendFileToStorage(receiptID, request.file.path, true).then(
            (storageHash:string) => {

              // Retrieve the CaseEscortReceipt from the database
              this.caseEscortReceiptRepository.findById(receiptID).then(
                (caseEscortReceipt: CaseEscortReceipt) => {
                  // Update the CaseEscortReceipt with details from SecureStorage
                  caseEscortReceipt.storageHash = storageHash;
                  caseEscortReceipt.createDate = (new Date()).toISOString();

                  // Store the updated CaseEscortReceipt in the database
                  this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                    resolve(caseEscortReceipt);
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


  @get('/companies/{companyID}/cases/{caseID}/escortReceipts', {
    responses: {
      '200': {
        description: 'Array of CaseEscortReceipt model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CaseEscortReceipt}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.query.object('filter', getFilterSchemaFor(CaseEscortReceipt)) filter?: Filter,
  ): Promise<CaseEscortReceipt[]> {
    if (filter === undefined) {
      filter = { where : { caseID : caseID} };
    }
    return await this.caseEscortReceiptRepository.find(filter);
  }


  @get('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}', {
    responses: {
      '200': {
        description: 'CaseEscortReceipt model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseEscortReceipt}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async findById(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('receiptID') receiptID: string
  ): Promise<CaseEscortReceipt> {
    return await this.caseEscortReceiptRepository.findById(receiptID);
  }


  @get('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
    responses: {
      '200': {
        description: 'CaseEscortReceipt model instance',
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
  async getCaseEscortReceiptFromSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('receiptID') receiptID: string,
    @param.query.boolean('archivedCase') archivedCase: boolean = false,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<boolean> {

    // Extend the Response timeouts
    response.setTimeout(600 * 1000);
    
    // Return a promise that will send the stored file
    return new Promise<boolean>((resolve, reject) => {

      if (archivedCase) {
        // Retrieve the CaseEscortReceipt from the database
        this.caseRepository.findById(caseID).then(
          (currentCase: CompanyCase) => {
            let caseEscortReceipt : CaseEscortReceipt = currentCase.escortReceipts.filter((v,i,l)=>{return v.receiptID == receiptID;})[0];

            // Make sure this CaseEscortReceipt references a file in SecureStorage
            if (caseEscortReceipt.storageHash == null || caseEscortReceipt.storageHash == undefined) {
              reject(new Error('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null'));
              return false;
            }
  
            // Retrieve the stored file from secure storage
            this.secureDocStorage.retrieveBinaryDataFromStorage(caseEscortReceipt.receiptID, caseEscortReceipt.storageHash, true).then(
              (escortReceiptFile:Buffer) => {
  
                // Attach the returned file to the Response
                response.attachment(caseEscortReceipt.name);
                response.contentType(MimeTypeResolver.resolveMimeType(caseEscortReceipt.name));
                response.send(escortReceiptFile);
                return true;
              }
            );
          }
        );
      } else {
        // Retrieve the CaseEscortReceipt from the database
        this.caseEscortReceiptRepository.findById(receiptID).then(
          (caseEscortReceipt: CaseEscortReceipt) => {
  
            // Make sure this CaseEscortReceipt references a file in SecureStorage
            if (caseEscortReceipt.storageHash == null || caseEscortReceipt.storageHash == undefined) {
              reject(new Error('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null'));
              return false;
            }
  
            // Retrieve the stored file from secure storage
            this.secureDocStorage.retrieveBinaryDataFromStorage(caseEscortReceipt.receiptID, caseEscortReceipt.storageHash, true).then(
              (escortReceiptFile:Buffer) => {
  
                // Attach the returned file to the Response
                response.attachment(caseEscortReceipt.name);
                response.contentType(MimeTypeResolver.resolveMimeType(caseEscortReceipt.name));
                response.send(escortReceiptFile);
                return true;
              }
            );
          }
        );
      }
    });
  }



  @patch('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}', {
    responses: {
      '204': {
        description: 'CaseEscortReceipt PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('receiptID') receiptID: string,
    @requestBody() caseEscortReceipt: CaseEscortReceipt,
  ): Promise<void> {

    // Ensure the CaseEscortReceipt matches the caseID in the path
    this.ensureEscortReceiptMatchesCaseID(caseEscortReceipt, caseID);

    await this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt);
  }


  @patch('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
    responses: {
      '204': {
        description: 'CaseEscortReceipt PATCH success',
        content: {'application/json': {schema: {'x-ts-type': CaseEscortReceipt}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateCaseEscortReceiptInSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('receiptID') receiptID: string,
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
  ): Promise<CaseEscortReceipt> {

    // Extend the Request and Response timeouts
    request.setTimeout(600 * 1000, ()=>{});
    response.setTimeout(600 * 1000);
    
    // Create an upload handler
    let uploadHandler : multer.Instance = this.provisionUploadHandler();

    // Return a promise that will process the uploaded file and send a result
    return new Promise<CaseEscortReceipt>((resolve, reject) => {
      // Receive any single file from the posted body in a field named 'file0'
      uploadHandler.single('file0')(request, response, err => {
        if (err) { return reject(err); }

        // Detect if the file data was provided as a DataURL or an attached File
        if (request.body !== undefined && request.body.file0 !== undefined) {
          // This file was provided as a DataURL

          // Convert the DataURL into just the Base64 data
          let imageBase64Data : string = request.body.file0.replace(/^data:[A-Za-z-+\/]+;base64,/, "");

          // Store the uploaded file to secure storage
          this.secureDocStorage.sendBase64DataToStorage(receiptID, imageBase64Data, true).then(
            (storageHash:string) => {

              // Retrieve the CaseEscortReceipt from the database
              this.caseEscortReceiptRepository.findById(receiptID).then(
                (caseEscortReceipt: CaseEscortReceipt) => {
                  // Update the CaseEscortReceipt with details from SecureStorage
                  caseEscortReceipt.storageHash = storageHash;
                  caseEscortReceipt.createDate = (new Date()).toISOString();

                  // Store the updated CaseEscortReceipt in the database
                  this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                    resolve(caseEscortReceipt);
                  });
                }
              );
            }
          );
        } else if (request.file !== undefined && request.file.path !== undefined) {
          // This file was provided as an attachment

          // Store the uploaded file in secure storage
          this.secureDocStorage.sendFileToStorage(receiptID, request.file.path, true).then(
            (storageHash:string) => {

              // Retrieve the CaseEscortReceipt from the database
              this.caseEscortReceiptRepository.findById(receiptID).then(
                (caseEscortReceipt: CaseEscortReceipt) => {
                  // Update the CaseEscortReceipt with details from SecureStorage
                  caseEscortReceipt.storageHash = storageHash;
                  caseEscortReceipt.createDate = (new Date()).toISOString();

                  // Store the updated CaseEscortReceipt in the database
                  this.caseEscortReceiptRepository.updateById(receiptID, caseEscortReceipt).then(() => {
                    resolve(caseEscortReceipt);
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


  @del('/companies/{companyID}/cases/{caseID}/escortReceipts/{receiptID}/file', {
    responses: {
      '204': {
        description: 'CaseEscortReceipt DELETE success'
      },
    },
  })
  @authenticate('JWTStrategy')
  async deleteCaseEscortReceiptFromSecureStorage(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.path.string('receiptID') receiptID: string,
  ): Promise<void> {    

    // Retrieve the CaseEscortReceipt from the database
    return this.caseEscortReceiptRepository.findById(receiptID).then(
      (caseEscortReceipt: CaseEscortReceipt) => {
        // Make sure this CaseEscortReceipt references a file in SecureStorage
        if (caseEscortReceipt.storageHash == null || caseEscortReceipt.storageHash == undefined) {
          //throw new Error('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null'));
          throw new HttpErrors.InternalServerError('CompanyCase EscortReceipt does not reference a file in SecureStorage.  StorageHash is null');
        }

        // Delete the stored file from secure storage
        return this.secureDocStorage.deleteDataFromStorage(caseEscortReceipt.receiptID, true);
      }).then( (success: boolean) => {
        // Delete the CaseEscortReceipt from the database
        return this.caseEscortReceiptRepository.deleteById(receiptID)
      }
    );

  }



  ensureEscortReceiptMatchesCaseID(caseEscortReceipt : CaseEscortReceipt, caseID : string) : void {
    // Throw errors if the caseID's do not match
    if (caseEscortReceipt.caseID != caseID) {
      throw new HttpErrors.BadRequest('CaseID provided in the request path does not match the CaseEscortReceipt caseID');
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
