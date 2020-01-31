import { Entity, ValueObject } from '@loopback/repository';
import { CasePatientAssessment } from './case-patient-assessment.model';
import { CasePatientProgress } from './case-patient-progress.model';
import { CaseEscortReceipt } from './case-escort-receipt.model';
import { CaseDocument } from './case-document.model';
import { CaseMessage } from './case-message.model';
export declare class CaseEscort extends ValueObject {
    escortID: string;
    name?: string;
    email?: string;
    paid?: boolean;
}
export declare class EscortLocation extends ValueObject {
    escortID: string;
    date: string;
    latitude: number;
    longitude: number;
    stage: string;
}
export declare class CaseStatusChange extends ValueObject {
    oldStatus: string;
    newStatus: string;
    date: string;
}
export declare class CaseTransportConsent extends ValueObject {
    signature: string;
    signersName: string;
    signatureDate: string;
    signersRelationshipToPatient: string;
    patientDOB: string;
    patientName: string;
    fromLocation: string;
    toLocation: string;
}
export declare class CompanyCase extends Entity {
    caseID: string;
    companyID: string;
    companyName?: string;
    caseNumber: string;
    currentStatus: string;
    patientFirstName?: string;
    patientLastName?: string;
    diagnosis?: string;
    firstDayOfTravel?: string;
    numberTravelDays?: number;
    originCity?: string;
    destinationCity?: string;
    quotedPrice?: number;
    invoiceSent?: boolean;
    invoicePaid?: boolean;
    flightNumber1?: string;
    connectionCity1?: string;
    flightNumber2?: string;
    connectionCity2?: string;
    flightNumber3?: string;
    payPerDay?: number;
    externalAccessEmail1?: string;
    externalAccessEmail2?: string;
    externalAccessEmail3?: string;
    patientConsent?: CaseTransportConsent;
    patientAssessment?: CasePatientAssessment;
    patientProgress?: CasePatientProgress;
    escorts: CaseEscort[];
    escortTracking: EscortLocation[];
    escortReceipts: CaseEscortReceipt[];
    statusChanges: CaseStatusChange[];
    documents: CaseDocument[];
    messages: CaseMessage[];
    constructor(data?: Partial<CompanyCase>);
}
