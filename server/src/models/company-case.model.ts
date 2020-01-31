import { Entity, ValueObject, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/repository-json-schema';
import { CasePatientAssessment } from './case-patient-assessment.model';
import { CasePatientProgress } from './case-patient-progress.model';
import { CaseEscortReceipt } from './case-escort-receipt.model';
import { CaseDocument } from './case-document.model';
import { CaseMessage } from './case-message.model';


@model()
export class CaseEscort extends ValueObject {
  @property({ type: 'string', required: true })     escortID: string;
  @property({ type: 'string' })                     name?: string;
  @property({ type: 'string' })                     email?: string;
  @property({ type: 'boolean' })                    paid?: boolean;
}


@model()
export class EscortLocation extends ValueObject {
  @property({ type: 'string', required: true })     escortID: string;
  @property({ type: 'date', required: true })       date: string;
  @property({ type: 'number', required: true })     latitude: number;
  @property({ type: 'number', required: true })     longitude: number;
  @property({ type: 'string', required: true })     stage: string;
}


@model()
export class CaseStatusChange extends ValueObject {
  @property({ type: 'string', required: true })     oldStatus: string;
  @property({ type: 'string', required: true })     newStatus: string;
  @property({ type: 'date', required: true })       date: string;
}



@model()
export class CaseTransportConsent extends ValueObject {
  @property({ type: 'string', required: true })     signature: string;
  @property({ type: 'string', required: true })     signersName: string;
  @property({ type: 'date', required: true })       signatureDate: string;
  @property({ type: 'string', required: true })     signersRelationshipToPatient: string;
  @property({ type: 'date', required: true })       patientDOB: string;
  @property({ type: 'string', required: true })     patientName: string;
  @property({ type: 'string', required: true })     fromLocation: string;
  @property({ type: 'string', required: true })     toLocation: string;
}




@model()
export class CompanyCase extends Entity {

  @property({ type: 'string', required: true, id: true })   caseID: string;
  @property({ type: 'string', required: true })             companyID: string;
  @property({ type: 'string' })                             companyName?: string;
  @property({ type: 'string', required: true })             caseNumber: string;
  @property({ type: 'string', required: true })             currentStatus: string;

  @property({ type: 'string' })                     patientFirstName?: string;
  @property({ type: 'string' })                     patientLastName?: string;
  @property({ type: 'string' })                     diagnosis?: string;
  @property({ type: 'date' })                       firstDayOfTravel?: string;
  @property({ type: 'number' })                     numberTravelDays?: number;
  @property({ type: 'string' })                     originCity?: string;
  @property({ type: 'string' })                     destinationCity?: string;
  @property({ type: 'number' })                     quotedPrice?: number;
  @property({ type: 'boolean' })                    invoiceSent?: boolean;
  @property({ type: 'boolean' })                    invoicePaid?: boolean;
  @property({ type: 'string' })                     flightNumber1?: string;
  @property({ type: 'string' })                     connectionCity1?: string;
  @property({ type: 'string' })                     flightNumber2?: string;
  @property({ type: 'string' })                     connectionCity2?: string;
  @property({ type: 'string' })                     flightNumber3?: string;
  @property({ type: 'number' })                     payPerDay?: number;
  @property({ type: 'string' })                     externalAccessEmail1?: string;
  @property({ type: 'string' })                     externalAccessEmail2?: string;
  @property({ type: 'string' })                     externalAccessEmail3?: string;

  @property({ type: 'object' })                     patientConsent? : CaseTransportConsent;
  @property({ type: 'object' })                     patientAssessment? : CasePatientAssessment;
  @property({ type: 'object' })                     patientProgress? : CasePatientProgress;
  

  @property.array(Object)                           escorts : CaseEscort[];
  @property.array(Object)                           escortTracking: EscortLocation[];
  @property.array(Object)                           escortReceipts : CaseEscortReceipt[];
  @property.array(Object)                           statusChanges : CaseStatusChange[];
  @property.array(Object)                           documents : CaseDocument[];
  @property.array(Object)                           messages : CaseMessage[];

  

  constructor(data?: Partial<CompanyCase>) {
    super(data);
  }
}



