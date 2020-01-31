import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  Condition,
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
} from '@loopback/rest';
import {inject, } from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';
import { decode } from 'jwt-simple';
import * as cloudant from '@cloudant/cloudant';
import { Configuration, ServerScope, DocumentScope, Query } from '@cloudant/cloudant';

import { 
  CompanyCase, 
  ReadOnlyUser, 
  Escort, 
  Company, 
  CaseEscort, 
  CaseEscortReceipt, 
  CaseStatusChange, 
  CaseDocument,
  CaseMessage, } from '../models';
import { 
  CompanyCaseRepository, 
  ReadOnlyUserRepository, 
  CompanyRepository, 
  CasePatientAssessmentRepository, 
  CasePatientProgressRepository, 
  CaseDocumentRepository, 
  CaseEscortReceiptRepository, 
  CaseMessageRepository} from '../repositories';
import { Config } from '../config';

// @ts-ignore
import * as config from '../datasources/cloudant.datasource.json';

const uuid62 = require('uuid62');
const sendgrid = require('@sendgrid/mail');

export class CompanyCasesController {

  constructor(
    @inject(AuthenticationBindings.CURRENT_USER)                    private user: UserProfile,
    @inject('datasources.config.cloudant', {optional: true})        private dsConfig: Configuration = config,
    @repository(CompanyCaseRepository)                              public companyCaseRepository : CompanyCaseRepository,
    @repository(CompanyRepository)                                  public companyRepository : CompanyRepository,
    @repository(ReadOnlyUserRepository)                             public readOnlyUserRepository : ReadOnlyUserRepository,
    @repository(CasePatientAssessmentRepository)                    public assessmentRepository : CasePatientAssessmentRepository,
    @repository(CasePatientProgressRepository)                      public patientProgressRepository : CasePatientProgressRepository,
    @repository(CaseDocumentRepository)                             public documentRepository : CaseDocumentRepository,
    @repository(CaseEscortReceiptRepository)                        public escortReceiptsRepository : CaseEscortReceiptRepository,
    @repository(CaseMessageRepository)                              public messageRepository : CaseMessageRepository
  ) {
    // Configure our API services
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  }


  @get('/companies/{companyID}/cases', {
    responses: {
      '200': {
        description: 'Array of CompanyCase model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CompanyCase}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.header.string('Authorization') credentials : string,
    @param.path.string('companyID') companyID: string,
    @param.query.object('filter', getFilterSchemaFor(CompanyCase)) filter?: Filter
  ): Promise<CompanyCase[]> {

    // Decode the JWT so we know the current user role
    let jwt : string = credentials.substr(credentials.indexOf(' ') + 1);
    let token : any = decode(jwt, Config.jwt.encryptingKey, false, Config.jwt.algorithm);

    // Connect to the Cloudant manually
    let cloudantConnection : ServerScope = cloudant(this.dsConfig);

    // Query the 'skycare' database, viewing the 'cases' design document, based on the current user role
    let queryResponse : any = await cloudantConnection.use('skycare').view('cases', 'active');

    if (queryResponse.total_rows == 0) {
      return [];
    } else {
      // Break the QueryResponse into Escorts, Companies, and CompanyCases
      let escorts : Escort[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('ESCORT')) { return v; }
                                                  }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
                                                                          return { 
                                                                            escortID: vxAsAny._id, 
                                                                            name: vxAsAny.name, 
                                                                            userID: vxAsAny.userID 
                                                                          } as Escort; });
      let companies : Company[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('COMPANY')) { return v; }
                                                     }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
                                                                             return { 
                                                                               companyID: vxAsAny._id, 
                                                                               emailForInvoices: vxAsAny.emailForInvoices, 
                                                                               name: vxAsAny.name 
                                                                              } as Company; });
      let companyCases : CompanyCase[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('CASE')) { return v; }
                                                            }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
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
                                                                                    } as CompanyCase; });

      // Remove all cases except the ones belonging to the requested company, if the requestor is a company
      if (token.role == 'client' && companyID != 'UNKNOWN') {
        companyCases = companyCases.filter((v,i,l)=>{ return v.companyID == companyID; });
      }

      // Embellish each CompanyCase with actual Company.name and the Escort.name values
      for ( let i = companyCases.length-1; i > -1; i--) {
        let company : Company | undefined = companies.find( (v,ix,l) => { return (v.companyID==companyCases[i].companyID); })
        companyCases[i].companyName = (company != undefined) ? company.name : '';

        // Remove all escorts except the current escort, if the requestor is an escort
        if (token.role == 'escort') {
          let currentEscort : Escort[] = escorts.filter( (v,ix,l) => { return (v.userID == token.sub); });
          if (currentEscort.length > 0) {
            // Check the current case to see if the current escort was assigned
            let assignedEscort : CaseEscort[] = companyCases[i].escorts.filter( (v,ix,l) => { return (v.escortID == currentEscort[0].escortID);})

            // If we found the current escort has been assigned, then make sure this is the only escort attached to the case
            if (assignedEscort.length > 0) {
              companyCases[i].escorts = [assignedEscort[0]];
            } else {
              // This case is not assigned to this escort.  Remove it and move to the next one
              companyCases.splice(i, 1);
              continue;
            }
          } else {
            // The logged in escort is not in the list of all escorts?.  Remove the case and move to the next one
            companyCases.splice(i, 1);
            continue;
          }
        }

        for ( let j = 0; j < companyCases[i].escorts.length; j++) {
          let escort : Escort | undefined = escorts.find( (vx,ix,lx) => { return (vx.escortID==companyCases[i].escorts[j].escortID);});
          companyCases[i].escorts[j].name = (escort != undefined) ? escort.name : '';
        }
      }      

      return companyCases;
    }
  }


  @post('/companies/{companyID}/cases', {
    responses: {
      '200': {
        description: 'CompanyCase model instance',
        content: {'application/json': {schema: {'x-ts-type': CompanyCase}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(
    @param.path.string('companyID') companyID: string,
    @requestBody() companyCase: CompanyCase
  ): Promise<CompanyCase> {

    // Ensure the CompanyCase matches the companyID in the path
    this.ensureCaseMatchesCompanyID(companyCase, companyID);

    // Create the new CompanyCase record in the database and return the result
    let createdCase : CompanyCase = await this.companyCaseRepository.create(companyCase);

    // Need to notify the Client and the assigned Escorts that they have access to this Case
    let assignedEmailAddress : string[] = [];

    // Lookup the Company associated with this Case
    let company : Company = await this.companyRepository.findById(companyCase.companyID);
    if (company.emailForUpdates1 !== undefined && company.emailForUpdates1 != null) { assignedEmailAddress.push(company.emailForUpdates1); }
    if (company.emailForUpdates2 !== undefined && company.emailForUpdates2 != null) { assignedEmailAddress.push(company.emailForUpdates2); }
    if (company.emailForUpdates3 !== undefined && company.emailForUpdates3 != null) { assignedEmailAddress.push(company.emailForUpdates3); }
    
    // Add each Escort to the list of emails
    for(let x = 0; x < companyCase.escorts.length; x++) {
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
      let externalAccessEmails : string[] = [];
      if (companyCase.externalAccessEmail1 !== undefined && companyCase.externalAccessEmail1.trim() != '') { externalAccessEmails.push(companyCase.externalAccessEmail1); }
      if (companyCase.externalAccessEmail2 !== undefined && companyCase.externalAccessEmail2.trim() != '') { externalAccessEmails.push(companyCase.externalAccessEmail2); }
      if (companyCase.externalAccessEmail3 !== undefined && companyCase.externalAccessEmail3.trim() != '') { externalAccessEmails.push(companyCase.externalAccessEmail3); }

      // Loop through the list of external access email, creating a record for each one and sending them emails
      for (let i = 0; i < externalAccessEmails.length; i++) {
        // Delay this step so that database updates are staggered
        setTimeout((async (email:string, caseID:string, caseNumber:string) => {
          // Create the limited access account for this email address
          let readOnlyUser : ReadOnlyUser = {
            externalAccessID : uuid62.v4(),
            email : email,
            caseID : caseID
          } as ReadOnlyUser;

          // Store the ReadOnlyUser in the database
          let savedReadyOnlyUser : ReadOnlyUser = await this.readOnlyUserRepository.create(readOnlyUser);
  
          // Send the ReadOnlyUser an email invitation
          this.sendExternalAccessEmail(savedReadyOnlyUser, caseNumber);
        }).bind(this, externalAccessEmails[i], createdCase.caseID, createdCase.caseNumber), 1000 *(i+1));
      }
    }

    return createdCase;
  }


  @get('/companies/{companyID}/cases/{caseID}', {
    responses: {
      '200': {
        description: 'CompanyCase model instance',
        content: {'application/json': {schema: {'x-ts-type': CompanyCase}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async findById(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string
  ): Promise<CompanyCase> {
    let requestedCase : CompanyCase = await this.companyCaseRepository.findById(caseID);
    if (requestedCase === undefined || requestedCase == null) { return requestedCase; }

    let company : Company = await this.companyRepository.findById(requestedCase.companyID);
    requestedCase.companyName = company.name;
    return requestedCase;
  }


  @get('/publicCases/{externalAccessID}', {
    responses: {
      '200': {
        description: 'CompanyCase model instance',
        content: {'application/json': {schema: {'x-ts-type': CompanyCase}}},
      },
    },
  })
  @authenticate('LimitedStrategy')
  async findByExternalAccessId(
    @param.path.string('externalAccessID') externalAccessID: string
  ): Promise<CompanyCase> {    
    // Retrieve the ReadOnlyUser in the database
    //let savedReadyOnlyUser : ReadOnlyUser = await this.readOnlyUserRepository.findById(externalAccessID);

    // Use this to retrieve the Case
    return await this.companyCaseRepository.findById((this.user as any).caseID);
  }


  @patch('/companies/{companyID}/cases/{caseID}', {
    responses: {
      '204': {
        description: 'CompanyCase PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() modifiedCase: CompanyCase,
    @param.query.boolean('sendEmail') sendEmail?: boolean,
    @param.query.string('emailComments') emailComments?: string
  ): Promise<void> {
    // Ensure the CompanyCase matches the companyID in the path
    await this.ensureCaseMatchesCompanyID(modifiedCase, companyID);

    // Retrieve the existing CompanyCase
    let existingCompanyCase : CompanyCase = await this.companyCaseRepository.findById(caseID);

    // Update the CompanyCase in the database
    await this.companyCaseRepository.updateById(caseID, modifiedCase);

    // Detect if any Escorts were added to this Case
    let newEscortEmailAddresses : string[] = modifiedCase.escorts.map( (v,i,l) => {
                                                if (existingCompanyCase.escorts.findIndex( (vx,ix,lx)=>{return vx.escortID==v.escortID;})==-1) {
                                                  return String(v.email);
                                                } else {
                                                  return '';
                                                }
                                            }).filter( (vxx,ixx,lxx)=>{
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

      let externalAccessEmailsToAdd : string[] = [];
      let externalAccessEmailsToRemove : string[] = [];

      if (modifiedCase.externalAccessEmail1 !== undefined && modifiedCase.externalAccessEmail1.trim() != '') { externalAccessEmailsToAdd.push(modifiedCase.externalAccessEmail1); }
      if (modifiedCase.externalAccessEmail2 !== undefined && modifiedCase.externalAccessEmail2.trim() != '') { externalAccessEmailsToAdd.push(modifiedCase.externalAccessEmail2); }
      if (modifiedCase.externalAccessEmail3 !== undefined && modifiedCase.externalAccessEmail3.trim() != '') { externalAccessEmailsToAdd.push(modifiedCase.externalAccessEmail3); }

      if (existingCompanyCase.externalAccessEmail1 !== undefined && existingCompanyCase.externalAccessEmail1.trim() != '') { externalAccessEmailsToRemove.push(existingCompanyCase.externalAccessEmail1); }
      if (existingCompanyCase.externalAccessEmail2 !== undefined && existingCompanyCase.externalAccessEmail2.trim() != '') { externalAccessEmailsToRemove.push(existingCompanyCase.externalAccessEmail2); }
      if (existingCompanyCase.externalAccessEmail3 !== undefined && existingCompanyCase.externalAccessEmail3.trim() != '') { externalAccessEmailsToRemove.push(existingCompanyCase.externalAccessEmail3); }

      // Trim both lists to only the differences
      for (let i = externalAccessEmailsToRemove.length - 1; i >= 0; i--) {
        let addListIndex : number = externalAccessEmailsToAdd.indexOf(externalAccessEmailsToRemove[i]);

        if (addListIndex > -1) {
          externalAccessEmailsToRemove.splice(i,1);
          externalAccessEmailsToAdd.splice(addListIndex,1);
        }
      }

      // Loop through the list of external access emails needing to be removed, deleting each ReadOnlyUser record
      for (let j = 0; j < externalAccessEmailsToRemove.length; j++) {
        // Delete the ReadOnlyUser from the database
        let searchCondition : Condition<ReadOnlyUser> = {
          email: externalAccessEmailsToRemove[j],
          caseID: modifiedCase.caseID
        };
        let count : Count = await this.readOnlyUserRepository.deleteAll(searchCondition);
        console.log('deleted ' + count.count + ' ReadOnlyUser records for ' + externalAccessEmailsToRemove[j] + ' - ' + modifiedCase.caseID);
      }


      // Loop through the list of external access emails needing to be added, creating a record for each one and sending them emails
      for (let k = 0; k < externalAccessEmailsToAdd.length; k++) {
        // Delay this step so that database updates are staggered
        setTimeout((async (email:string, caseID:string, caseNumber:string) => {
          // Create the limited access account for this email address
          let readOnlyUser : ReadOnlyUser = {
            externalAccessID : uuid62.v4(),
            email : email,
            caseID : caseID
          } as ReadOnlyUser;

          // Store the ReadOnlyUser in the database
          let savedReadyOnlyUser : ReadOnlyUser = await this.readOnlyUserRepository.create(readOnlyUser);
  
          // Send the ReadOnlyUser an email invitation
          this.sendExternalAccessEmail(savedReadyOnlyUser, caseNumber);
          console.log('created a ReadOnlyUser record for ' + email + ' - ' + caseID + ' - ' + caseNumber);
        }).bind(this, externalAccessEmailsToAdd[k], modifiedCase.caseID, modifiedCase.caseNumber), 1000 *(externalAccessEmailsToRemove.length+k+1));
      }
    }

    // Check if we are supposed to send an email notification about the most recent status change for this Case
    if (sendEmail !== undefined && sendEmail != null && sendEmail == true) {
      // Lookup the Company associated with this Case
      let company : Company = await this.companyRepository.findById(modifiedCase.companyID);

      let emailAddressesToSendNoticeTo : string[] = [Config.email.statusChangeNotification.fromEmail];
      if (company.emailForUpdates1 !== undefined && company.emailForUpdates1 != null && company.emailForUpdates1.trim().length > 0) { emailAddressesToSendNoticeTo.push(company.emailForUpdates1); }
      if (company.emailForUpdates2 !== undefined && company.emailForUpdates2 != null && company.emailForUpdates2.trim().length > 0) { emailAddressesToSendNoticeTo.push(company.emailForUpdates2); }
      if (company.emailForUpdates3 !== undefined && company.emailForUpdates3 != null && company.emailForUpdates3.trim().length > 0) { emailAddressesToSendNoticeTo.push(company.emailForUpdates3); }
      
      // Only send the notifications if an email address was specified for the Company
      if (emailAddressesToSendNoticeTo.length > 0) {            
        this.sendStatusChangeNotificationEmail(modifiedCase, emailAddressesToSendNoticeTo, emailComments);
      }
    }
  }






  @get('/companies/UNDEFINED/cases/UNDEFINED/unpaidEscorts', {
    responses: {
      '200': {
        description: 'Array of CompanyCase model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CompanyCase}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async findUnpaidEscorts(): Promise<CompanyCase[]> {
    // Connect to the Cloudant manually
    let cloudantConnection : ServerScope = cloudant(this.dsConfig);

    // Query the 'skycare' database, viewing the 'cases' design document, based on the current user role
    let queryResponse : any = await cloudantConnection.use('skycare').view('cases', 'active');

    if (queryResponse.total_rows == 0) {
      return [];
    } else {
      // Break the QueryResponse into Escorts, EscortReceipts, Companies, and CompanyCases
      let escorts : Escort[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('ESCORT')) { return v; }
                                                  }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
                                                                          return { 
                                                                            escortID: vxAsAny._id, 
                                                                            name: vxAsAny.name, 
                                                                            userID: vxAsAny.userID 
                                                                          } as Escort; });
      let escortReceipts : CaseEscortReceipt[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('ESCORTRECEIPT')) { return v; }
                                                                    }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
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
                                                                          } as CaseEscortReceipt; });
      let companies : Company[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('COMPANY')) { return v; }
                                                     }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
                                                                             return { 
                                                                               companyID: vxAsAny._id, 
                                                                               emailForInvoices: vxAsAny.emailForInvoices, 
                                                                               name: vxAsAny.name 
                                                                              } as Company; });
      let companyCases : CompanyCase[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('CASE') && v.value.currentStatus == 'All case documentation & receipts complete') { return v; }
                                                            }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
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
                                                                                    } as CompanyCase; });

      // Embellish each CompanyCase with actual Company.name, Escort.name, and CaseEscortReceipt values
      for ( let i = companyCases.length-1; i > -1; i--) {
        let caseID : string = companyCases[i].caseID;
        let company : Company | undefined = companies.find( (vx,ix,lx) => { return (vx.companyID==companyCases[i].companyID); })
        companyCases[i].companyName = (company != undefined) ? company.name : '';

        for ( let j = 0; j < companyCases[i].escorts.length; j++) {
          let escort : Escort | undefined = escorts.find( (vx,ix,lx) => { return (vx.escortID==companyCases[i].escorts[j].escortID);});
          companyCases[i].escorts[j].name = (escort != undefined) ? escort.name : '';
        }

        for ( let j = 0; j < companyCases[i].escorts.length; j++ ) {
          let escortID : string = companyCases[i].escorts[j].escortID;
          let receipts : CaseEscortReceipt[] = escortReceipts.filter( (v,i,l)=>{ if(v.caseID==caseID && v.escortID==escortID){ return v; } });

          if (companyCases[i].escortReceipts !== undefined && companyCases[i].escortReceipts != null && companyCases[i].escortReceipts.length > 0) { 
            companyCases[i].escortReceipts.concat(receipts);
          } else {
            companyCases[i].escortReceipts = receipts; 
          }
        }
      }      

      return companyCases;
    }
  }


  @post('/companies/UNDEFINED/cases/{caseID}/unpaidEscorts/{escortID}', {
    responses: {
      '200': {
        description: 'Success / Failure indication',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async markCaseEscortPaid(
    @param.path.string('caseID') caseID: string,
    @param.path.string('escortID') escortID: string): Promise<boolean> {

    try {
      // Retrieve the existing CompanyCase
      let existingCompanyCase : CompanyCase = await this.companyCaseRepository.findById(caseID);

      // Update the CompanyCase in the database
      let escortIndex : number = existingCompanyCase.escorts.findIndex( (v,i,l)=> { return v.escortID == escortID; });
      existingCompanyCase.escorts[escortIndex].paid = true;
      await this.companyCaseRepository.updateById(caseID, existingCompanyCase);

      // Check if Case should be archived
      await this.archiveCaseIfComplete(existingCompanyCase);

      return true;
    } catch(e) {
      return false;
    }
  }




  @get('/companies/UNDEFINED/unpaidCases', {
    responses: {
      '200': {
        description: 'Array of CompanyCase model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CompanyCase}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async findUnpaidCases(): Promise<CompanyCase[]> {
    // Connect to the Cloudant manually
    let cloudantConnection : ServerScope = cloudant(this.dsConfig);

    // Query the 'skycare' database, viewing the 'cases' design document, based on the current user role
    let queryResponse : any = await cloudantConnection.use('skycare').view('cases', 'active');

    if (queryResponse.total_rows == 0) {
      return [];
    } else {
      // Break the QueryResponse into Escorts, EscortReceipts, Companies, and CompanyCases
      let escorts : Escort[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('ESCORT')) { return v; }
                                                  }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
                                                                          return { 
                                                                            escortID: vxAsAny._id, 
                                                                            name: vxAsAny.name, 
                                                                            userID: vxAsAny.userID 
                                                                          } as Escort; });
      let companies : Company[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('COMPANY')) { return v; }
                                                     }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
                                                                             return { 
                                                                               companyID: vxAsAny._id, 
                                                                               emailForInvoices: vxAsAny.emailForInvoices, 
                                                                               name: vxAsAny.name 
                                                                              } as Company; });
      let companyCases : CompanyCase[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { if (v.key.includes('CASE') && v.value.currentStatus == 'All case documentation & receipts complete' && v.value.invoiceSent == true && v.value.invoicePaid != true ) { return v; }
                                                            }).map( (vx:any,ix:number,lx:any[]) => { let vxAsAny : any = vx.value as any; 
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
                                                                                    } as CompanyCase; });

      // Embellish each CompanyCase with actual Company.name, Escort.name, and CaseEscortReceipt values
      for ( let i = companyCases.length-1; i > -1; i--) {
        let caseID : string = companyCases[i].caseID;
        let company : Company | undefined = companies.find( (v,vi,l) => { return (v.companyID==companyCases[i].companyID); })
        companyCases[i].companyName = (company != undefined) ? company.name : '';

        for ( let j = 0; j < companyCases[i].escorts.length; j++) {
          let escort : Escort | undefined = escorts.find( (vx,ix,lx) => { return (vx.escortID==companyCases[i].escorts[j].escortID);});
          companyCases[i].escorts[j].name = (escort != undefined) ? escort.name : '';
        }
      }      

      return companyCases;
    }
  }


  @post('/companies/UNDEFINED/unpaidCases/{caseID}', {
    responses: {
      '200': {
        description: 'Success / Failure indication',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async markCasePaid(@param.path.string('caseID') caseID: string): Promise<boolean> {

    try {
      // Retrieve the existing CompanyCase
      let existingCompanyCase : CompanyCase = await this.companyCaseRepository.findById(caseID);

      // Update the CompanyCase in the database
      existingCompanyCase.invoicePaid = true;
      await this.companyCaseRepository.updateById(caseID, existingCompanyCase);

      // Check if Case should be archived
      await this.archiveCaseIfComplete(existingCompanyCase);

      return true;
    } catch(e) {
      return false;
    }
  }



  @get('/companies/UNDEFINED/archivedCases', {
    responses: {
      '200': {
        description: 'Array of CompanyCase model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CompanyCase}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async findArchivedCases(): Promise<CompanyCase[]> {
    return await this.companyCaseRepository.find( { where: { currentStatus: 'ARCHIVED' } } );
  }



  ensureCaseMatchesCompanyID(companyCase : CompanyCase, companyID : string) : void {
    // Throw errors if the companyID's do not match
    if (companyCase.companyID != companyID) {
      throw new HttpErrors.BadRequest('CompanyID provided in the request path does not match the CompanyCase companyID');
    }
  }


  sendNewCaseAssignmentEmail(newCase : CompanyCase, emailAddresses : string[]) : void {
    // CASE_ID = newCase.caseID
    // ACCESS_URL = process.env.MAIN_URL + '/case/view/' + CASE_ID

    // Send an email to all participants on the new Case
    for (let i = 0; i < emailAddresses.length; i++) {
      const emailMessage = {
        to: emailAddresses[i].toLowerCase(),
        from: Config.email.newCaseAssigned.fromEmail,
        templateId: Config.email.newCaseAssigned.templateID,
        dynamic_template_data: {
          CASE_ID: newCase.caseNumber,
          ACCESS_URL: process.env.MAIN_URL + Config.email.newCaseAssigned.linkBaseURL + newCase.caseID
        }
      }
      sendgrid.send(emailMessage);
    }
  }


  sendExternalAccessEmail(readOnlyUser : ReadOnlyUser, caseNumber : string) : void {
    // Send an email to the new User, inviting them to setup their account
    const emailMessage = {
      to: readOnlyUser.email.toLowerCase(),
      from: Config.email.limitedCaseAccess.fromEmail,
      templateId: Config.email.limitedCaseAccess.templateID,
      dynamic_template_data: {
        CASE_ID: caseNumber,
        ACCESS_URL: process.env.MAIN_URL + Config.email.limitedCaseAccess.linkBaseURL + readOnlyUser.externalAccessID
      }
    }
    sendgrid.send(emailMessage);
  }


  sendStatusChangeNotificationEmail(modifiedCase : CompanyCase, emailAddresses : string[], emailComments : string = '') : void {
    // Send an email to anyone associated with the client Company that is requesting updates
    for (let i = 0; i < emailAddresses.length; i++) {
      const emailMessage = {
        to: emailAddresses[i].toLowerCase(),
        from: Config.email.statusChangeNotification.fromEmail,
        templateId: Config.email.statusChangeNotification.templateID,
        dynamic_template_data: {
          CASE_ID: modifiedCase.caseNumber,
          NEW_STATUS: modifiedCase.currentStatus,
          COMMENTS: emailComments
        }
      }
      console.log(JSON.stringify(emailMessage));
      sendgrid.send(emailMessage);
    }
  }


  async archiveCaseIfComplete(companyCase : CompanyCase) : Promise<void> {
    const FINAL_CASE_STATUS : string = 'All case documentation & receipts complete';

    // Check if the current status is the FINAL status
    if (companyCase.currentStatus != FINAL_CASE_STATUS) { return; }

    // Check if the invoice is marked PAID
    if (companyCase.invoicePaid != true) { return; }

    // Check if all escorts are marked PAID
    if (companyCase.escorts.some((v,i,l)=>{ return v.paid != true; })) { return; }

    // Change the case status to ARCHIVED
    let newCaseStatusChange : CaseStatusChange = {
      newStatus: 'ARCHIVED',
      oldStatus: companyCase.currentStatus,
      date: (new Date()).toISOString()
    } as CaseStatusChange;

    companyCase.currentStatus = 'ARCHIVED';
    companyCase.statusChanges.push(newCaseStatusChange);
    
    // Repackage case to include all parts in a single document 
    let escortReceipts : CaseEscortReceipt[] = await this.escortReceiptsRepository.find({ where: { caseID: companyCase.caseID }});
    companyCase.escortReceipts = escortReceipts;
    let documents : CaseDocument[] = await this.documentRepository.find({ where: { caseID: companyCase.caseID }});  
    companyCase.documents = documents;
    let messages : CaseMessage[] = await this.messageRepository.find({ where: { caseID: companyCase.caseID }});
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

}
