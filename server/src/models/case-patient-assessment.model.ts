import {Entity, model, property} from '@loopback/repository';


@model()
export class CasePatientAssessment extends Entity {

  @property({ type: 'string', required: true, id: true })   patientAssessmentID: string;
  @property({ type: 'string', required: true })             caseID: string;


  @property({ type: 'boolean' })                        airwayUsingO2?: boolean;
  @property({ type: 'number' })                         airwayPatientO2LPM?: number;
  @property({ type: 'boolean' })                        airwayUsingBVM?: boolean;
  @property({ type: 'boolean' })                        airwayUsingETT?: boolean;
  @property({ type: 'number' })                         airwayUsingETTSize?: number;
  @property({ type: 'string' })                         airwayUsingETTRate?: string;
  @property({ type: 'boolean' })                        airwayUsingOPANPA?: boolean;
  @property({ type: 'boolean' })                        airwayUsingTrach?: boolean;
  @property({ type: 'number' })                         airwayUsingTrachSize?: number;
  @property({ type: 'string' })                         airwayNotes?: string;

  @property.array(String)                               respBreathing?: string[];
  @property({ type: 'boolean' })                        respTracheaMidline?: boolean;
  @property({ type: 'boolean' })                        respCough?: boolean;
  @property({ type: 'string' })                         respCoughProductive?: string;
  @property({ type: 'string' })                         respChestWallExpansion?: string;
  @property({ type: 'boolean' })                        respChestTrauma?: boolean;
  @property({ type: 'string' })                         respBreathSounds?: string;
  @property({ type: 'boolean' })                        respBreathDiminishedRight?: boolean;
  @property({ type: 'boolean' })                        respBreathDiminishedLeft?: boolean;
  @property({ type: 'string' })                         respMonitors?: string;
  @property({ type: 'string' })                         respSupplimentaryO2Device?: string;
  @property({ type: 'number' })                         respEquipLPM?: number;
  @property({ type: 'number' })                         respEquipPercent?: number;


  @property({ type: 'number' })                         cardiacRate?: number;
  @property({ type: 'string' })                         cardiacRhythm?: string;
  @property({ type: 'string' })                         cardiacSounds?: string;
  @property({ type: 'string' })                         cardiacJvd?: string;
  @property({ type: 'string' })                         cardiacPeripheralEdemaLocation?: string;
  @property({ type: 'number' })                         cardiacPeripheralEdemaScore?: number;
  @property({ type: 'boolean' })                        cardiacExternalPacing?: boolean;
  @property({ type: 'number' })                         cardiacExternalPacingMA?: number;
  @property({ type: 'number' })                         cardiacExternalPacingRate?: number;
  @property({ type: 'string' })                         cardiacEcgFindings?: string;
  @property({ type: 'string' })                         cardiacNotes?: string;
  @property.array(String)                               cardiacEquipment?: string[];


  @property.array(String)                               abdomenCondition?: string[];
  @property.array(String)                               abdomenTenderness?: string[];
  @property({ type: 'string' })                         abdomenBowelSounds?: string;
  @property({ type: 'string' })                         abdomenFeedTube?: string;
  @property({ type: 'string' })                         abdomenFeedTubeSize?: string;
  @property({ type: 'string' })                         abdomenFeedTubeState?: string;
  @property({ type: 'string' })                         abdomenNotes?: string;


  @property({ type: 'boolean' })                        pelvisStable?: boolean;
  @property({ type: 'boolean' })                        pelvisFoley?: boolean;
  @property({ type: 'number' })                         pelvisFoleySize?: number;
  @property({ type: 'string' })                         pelvisAppearanceOfUrine?: string;
  @property({ type: 'string' })                         pelvisNotes?: string;


  @property({ type: 'boolean' })                        painDenies?: boolean;
  @property({ type: 'string' })                         painLocation?: string;
  @property.array(String)                               painSensation?: string[];
  @property({ type: 'number' })                         painScale?: number;


  @property.array(String)                               backTrauma?: string[];
  @property({ type: 'string' })                         backNotes?: string;


  @property.array(String)                               extremitiesTrauma?: string[];
  @property({ type: 'number' })                         extremitiesPulsesRUE?: number;
  @property({ type: 'number' })                         extremitiesPulsesLUE?: number;
  @property({ type: 'number' })                         extremitiesPulsesRLE?: number;
  @property({ type: 'number' })                         extremitiesPulsesLLE?: number;


  @property({ type: 'string' })                         demeanorSpeech?: string;
  @property.array(String)                               demeanorSkin?: string[];
  @property({ type: 'string' })                         demeanorBehavior?: string;


  @property({ type: 'string' })                         neuroEyes?: string;
  @property({ type: 'string' })                         neuroVerbal?: string;
  @property({ type: 'string' })                         neuroMotor?: string;
  @property({ type: 'number' })                         neuroGcsScore?: number;
  @property({ type: 'boolean' })                        neuroHeentTrauma?: boolean;
  @property({ type: 'boolean' })                        neuroPupilsPERRLA?: boolean;
  @property({ type: 'number' })                         neuroSizeLeft?: number;
  @property({ type: 'number' })                         neuroSizeRight?: number;
  @property({ type: 'number' })                         neuroReactionLeft?: number;
  @property({ type: 'number' })                         neuroReactionRight?: number;
  @property({ type: 'string' })                         neuroNotes?: string;

  
  @property({ type: 'string' })                         diagramAnnotations?: string;
  @property({ type: 'string' })                         diagramNotes?: string;


  @property({ type: 'string' })                         overallSignature?: string;



  constructor(data?: Partial<CasePatientAssessment>) {
    super(data);
  }
}
