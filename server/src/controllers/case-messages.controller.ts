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
} from '@loopback/rest';
import {CaseMessage, CompanyCase, Company} from '../models';
import {CaseMessageRepository, CompanyCaseRepository, CompanyRepository} from '../repositories';
import { authenticate, AuthenticationBindings, UserProfile } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { Config } from '../config';

const sendgrid = require('@sendgrid/mail');


export class CaseMessagesController {

  constructor( 
    @inject(AuthenticationBindings.CURRENT_USER)    private user: UserProfile,
    @repository(CaseMessageRepository)              public caseMessageRepository : CaseMessageRepository,
    @repository(CompanyCaseRepository)              public companyCaseRepository : CompanyCaseRepository,
    @repository(CompanyRepository)                  public companyRepository : CompanyRepository ) {}



  @post('/companies/{companyID}/cases/{caseID}/messages', {
    responses: {
      '200': {
        description: 'CaseMessage model instance',
        content: {'application/json': {schema: {'x-ts-type': CaseMessage}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() caseMessage: CaseMessage): Promise<CaseMessage> {
      try {
        if (caseMessage.caseID != caseID) {
          caseMessage.caseID = caseID;
        }
        if (this.user.name !== undefined && caseMessage.senderID != this.user.name) {
          caseMessage.senderID = this.user.name;
        }
        let savedCaseMessage : CaseMessage = await this.caseMessageRepository.create(caseMessage);

        // Retrieve the existing Case from storage
        let currentCase : CompanyCase = await this.companyCaseRepository.findById(caseID);

        // Need to notify the Client and the assigned Escorts that a message was added to this Case
        let assignedEmailAddress : string[] = [];

        // Lookup the Company associated with this Case
        let company : Company = await this.companyRepository.findById(currentCase.companyID);
        if (company.emailForUpdates1 !== undefined && company.emailForUpdates1 != null) { assignedEmailAddress.push(company.emailForUpdates1); }
        if (company.emailForUpdates2 !== undefined && company.emailForUpdates2 != null) { assignedEmailAddress.push(company.emailForUpdates2); }
        if (company.emailForUpdates3 !== undefined && company.emailForUpdates3 != null) { assignedEmailAddress.push(company.emailForUpdates3); }
        
        // Add each Escort to the list of emails
        for(let x = 0; x < currentCase.escorts.length; x++) {
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
          assignedEmailAddress = assignedEmailAddress.filter( (v,i,l)=>{ 
            // @ts-ignore
            return v.toLowerCase() != this.user.email.toLowerCase(); 
          });

          if (assignedEmailAddress.length > 0) {
            // Send the notification email to all assigned members of this Case
            this.sendNewCaseMessageEmail(currentCase.caseNumber, savedCaseMessage, assignedEmailAddress);
          } else {
            console.log('WARN: Noone to send an email to for new CaseMessage');
          }
        }

        return savedCaseMessage;
    } catch (err) {
      console.log('ERROR: Failed to save a CaseMessage');
      console.log(JSON.stringify(err));
      throw err;
    }
  }



  @get('//companies/{companyID}/cases/{caseID}/messages', {
    responses: {
      '200': {
        description: 'Array of CaseMessage model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CaseMessage}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.query.object('filter', getFilterSchemaFor(CaseMessage)) filter?: Filter,
  ): Promise<CaseMessage[]> {
    if (filter === undefined || filter == null) {
      filter = { where: { caseID : caseID } } as Filter;
    }

    return await this.caseMessageRepository.find(filter);
  }




  sendNewCaseMessageEmail(caseNumber : string, newMessage : CaseMessage, emailAddresses : string[]) : void {
    // Send an email to all participants on the Case
    for (let i = 0; i < emailAddresses.length; i++) {
      console.log('INFO: Sending CaseMessage to ' + emailAddresses[i].toLowerCase());
      const emailMessage = {
        to: emailAddresses[i].toLowerCase(),
        from: Config.email.newCaseMessage.fromEmail,
        templateId: Config.email.newCaseMessage.templateID,
        dynamic_template_data: {
          CASE_ID: caseNumber,
          MSG_SENDER: newMessage.senderID,
          MESSAGE: newMessage.message
        }
      }
      sendgrid.send(emailMessage);
    }
  }

}
