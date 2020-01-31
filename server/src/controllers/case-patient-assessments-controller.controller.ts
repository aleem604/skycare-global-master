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
} from '@loopback/rest';
import {CasePatientAssessment} from '../models';
import {CasePatientAssessmentRepository} from '../repositories';

export class CasePatientAssessmentsController {


  constructor(
    @repository(CasePatientAssessmentRepository) public casePatientAssessmentRepository : CasePatientAssessmentRepository,
  ) {}


  @post('/companies/{companyID}/cases/{caseID}/patientAssessment', {
    responses: {
      '200': {
        description: 'CasePatientAssessment model instance',
        content: {'application/json': {schema: {'x-ts-type': CasePatientAssessment}}},
      },
    },
  })
  async create(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() casePatientAssessment: CasePatientAssessment): Promise<CasePatientAssessment> {
      // Ensure that the provided CasePatientAssessment has a caseID that matches the path caseID
      if (casePatientAssessment.caseID != caseID) { throw new HttpErrors.BadRequest("CasePatientAssessment.caseID does not match the URL path caseID"); }

      // Make sure that now other CasePatientAssessment records exist for this caseID
      let recordCount : Count = await this.casePatientAssessmentRepository.count( { caseID : caseID } );
      if ( recordCount.count > 0 ) { throw new HttpErrors.BadRequest("A CasePatientAssessment record already exists for a Case with caseID : " + caseID); }

      // Create the CasePatientAssessment
      return await this.casePatientAssessmentRepository.create(casePatientAssessment);
  }


  @get('/companies/{companyID}/cases/{caseID}/patientAssessment', {
    responses: {
      '200': {
        description: 'Array of CasePatientAssessment model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CasePatientAssessment}},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.query.object('filter', getFilterSchemaFor(CasePatientAssessment)) filter?: Filter,
  ): Promise<CasePatientAssessment[]> {
    // Create a basic filter if the filter argument is blank
    if (filter === undefined || filter == null || filter.where === undefined || filter.where == null) {
      filter = { where: { caseID: caseID } }; 
    }

    return await this.casePatientAssessmentRepository.find(filter);
  }


  @patch('/companies/{companyID}/cases/{caseID}/patientAssessment', {
    responses: {
      '200': {
        description: 'CasePatientAssessment PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() casePatientAssessment: CasePatientAssessment
  ): Promise<boolean> {
    // Ensure that the provided CasePatientAssessment has a caseID that matches the path caseID
    if (casePatientAssessment.caseID != caseID) { throw new HttpErrors.BadRequest("CasePatientAssessment.caseID does not match the URL path caseID"); }

    // Check if this Case already has a CasePatientAssessment
    let recordCount : Count = await this.casePatientAssessmentRepository.count( { caseID : caseID } );

    // Create or Update the CasePatientAssessment based on whether it exists already
    if (recordCount.count == 0) {
      let savedAssessment : CasePatientAssessment = await this.casePatientAssessmentRepository.create(casePatientAssessment);
      return true;
    } else {
      let updatedAsssesments : Count = await this.casePatientAssessmentRepository.updateAll(casePatientAssessment, { caseID : caseID });
      return (updatedAsssesments.count == 1);
    }
  }


}
