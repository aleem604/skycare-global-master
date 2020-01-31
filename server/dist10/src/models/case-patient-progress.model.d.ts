import { Entity, ValueObject } from '@loopback/repository';
export declare class VitalSignsStatus extends ValueObject {
    userID: string;
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    temperature: string;
    bloodSugar: string;
    oxygenSaturation: string;
    oxygenFlowRate: string;
    measurementMode: string;
    painMeasurement: number;
    date: string;
}
export declare class DeliveredMedications extends ValueObject {
    description: string;
    dose: string;
    route: string;
    userID: string;
    patientResponse: string;
    date: string;
}
export declare class ProgressNote extends ValueObject {
    userID: string;
    text: string;
    date: string;
}
export declare class CasePatientProgress extends Entity {
    patientProgressID: string;
    caseID: string;
    escort1ID?: string;
    escort1Signature?: string;
    escort2ID?: string;
    escort2Signature?: string;
    medicalProviderName?: string;
    medicalProviderSignature?: string;
    medicalProviderSignatureDate?: string;
    patientBelongings: boolean;
    patientBelongingsDesc?: string;
    statusUpdates: VitalSignsStatus[];
    medications: DeliveredMedications[];
    notes: ProgressNote[];
    constructor(data?: Partial<CasePatientProgress>);
}
