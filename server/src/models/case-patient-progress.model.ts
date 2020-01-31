import {Entity, model, property, ValueObject} from '@loopback/repository';





@model()
export class VitalSignsStatus extends ValueObject {
  @property({ type: 'string', required: true })     userID: string;
  @property({ type: 'string', required: true })     bloodPressure: string;
  @property({ type: 'string', required: true })     heartRate: string;
  @property({ type: 'string', required: true })     respiratoryRate: string;
  @property({ type: 'string', required: true })     temperature: string;
  @property({ type: 'string', required: true })     bloodSugar: string;
  @property({ type: 'string', required: true })     oxygenSaturation: string;
  @property({ type: 'string', required: true })     oxygenFlowRate: string;
  @property({ type: 'string', required: true })     measurementMode: string;
  @property({ type: 'number', required: true })     painMeasurement: number;
  @property({ type: 'date', required: true })       date: string;

}


@model()
export class DeliveredMedications extends ValueObject {
  @property({ type: 'string', required: true })     description: string;
  @property({ type: 'string', required: true })     dose: string;
  @property({ type: 'string', required: true })     route: string;
  @property({ type: 'string', required: true })     userID: string;
  @property({ type: 'string', required: true })     patientResponse: string;
  @property({ type: 'date', required: true })       date: string;
}


@model()
export class ProgressNote extends ValueObject {
  @property({ type: 'string', required: true })     userID: string;
  @property({ type: 'string', required: true })     text: string;
  @property({ type: 'date', required: true })       date: string;
}






@model()
export class CasePatientProgress extends Entity {

  @property({ type: 'string', required: true, id: true })             patientProgressID: string;
  @property({ type: 'string', required: true })                       caseID: string;

  @property({ type: 'string' })                                       escort1ID?: string;
  @property({ type: 'string' })                                       escort1Signature?: string;
  @property({ type: 'string' })                                       escort2ID?: string;
  @property({ type: 'string' })                                       escort2Signature?: string;
  @property({ type: 'string' })                                       medicalProviderName?: string;
  @property({ type: 'string' })                                       medicalProviderSignature?: string;
  @property({ type: 'date' })                                         medicalProviderSignatureDate?: string;

  @property({ type: 'boolean', required: true, default: false })      patientBelongings: boolean;
  @property({ type: 'string' })                                       patientBelongingsDesc?: string;


  @property.array(Object)                                             statusUpdates : VitalSignsStatus[];
  @property.array(Object)                                             medications : DeliveredMedications[];
  @property.array(Object)                                             notes : ProgressNote[];   


  constructor(data?: Partial<CasePatientProgress>) {
    super(data);
  }
}
