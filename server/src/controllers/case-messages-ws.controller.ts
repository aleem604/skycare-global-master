import { Socket } from 'socket.io'
import { ws } from '../decorators/websocket.decorator';


import { CaseMessage, CompanyCase, Company } from '../models';
import { CaseMessageRepository, CompanyCaseRepository, CompanyRepository } from '../repositories';
import { repository } from '@loopback/repository';
import { inject } from '@loopback/core';
import { Config } from '../config';

const sendgrid = require('@sendgrid/mail');



@ws('/messages')
export class CaseMessagesWSController {

   // Equivalent to `@inject('ws.socket')`
  constructor( @ws.socket() private socket: Socket, 
               @repository(CaseMessageRepository)       public caseMessageRepository : CaseMessageRepository,
               @repository(CompanyCaseRepository)       public companyCaseRepository : CompanyCaseRepository,
               @repository(CompanyRepository)           public companyRepository : CompanyRepository) {}

  // Invoked when a client connects to the server
  @ws.connect() connect(socket: Socket) { console.log(' - CONNECTED    : %s', this.socket.id); }

  // Invoked when a client disconnects from the server
  @ws.disconnect() disconnect() { console.log(' - DISCONNECTED : %s', this.socket.id); }

  // Debug handler for all events
  @ws.subscribe(/.+/) logMessage(...args: any[]) { 
    //console.log(' - DEBUGGING    : %s - %s', this.socket.id, args[0][0]); 
  }





  // Handler for 'message' events
  @ws.subscribe('message')
  handleCaseMessage(caseMessage: CaseMessage) {
    // Extract the caseID from the namespace
    let namespaceParts : string[] = this.socket.nsp.name.split('/');
    let namespaceCaseID : string = namespaceParts[namespaceParts.length-1];

    // Ensure the namespace matches the one supplied in the message
    if (namespaceCaseID != caseMessage.caseID) {
      // Swallow this error condition.  Someone is intentionally sending bad messages
    } else {
      // Save this message to the database
      this.caseMessageRepository.create(caseMessage).then(
        async (savedCaseMessage:CaseMessage) => {  
          // Notify all clients in this namespace about this message
          console.log(' - MESSAGE      : %s - %s', this.socket.id, caseMessage.message);
          this.socket.nsp.emit('message', `[${this.socket.id}] ${JSON.stringify(caseMessage)}`);
          
          // Retrieve the existing Case from storage
          let currentCase : CompanyCase = await this.companyCaseRepository.findById(caseMessage.caseID);

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
            if (assignedEmailAddress.length > 0) {
              // Send the notification email to all assigned members of this Case
              this.sendNewCaseMessageEmail(currentCase.caseNumber, savedCaseMessage, assignedEmailAddress);
            } else {
              console.log('WARN: Noone to send an email to for new CaseMessage');
            }
          } else {
            console.log('WARN: Noone to send an email to for new CaseMessage');
          }
        }
      ).catch( (err:Error) => {
        console.log('ERROR: Failed to save a CaseMessage');
        console.log(JSON.stringify(err));
      });
    }
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