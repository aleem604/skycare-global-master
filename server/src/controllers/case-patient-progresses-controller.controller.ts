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
import {CasePatientProgress} from '../models';
import {CasePatientProgressRepository} from '../repositories';

export class CasePatientProgressesController {
  constructor(
    @repository(CasePatientProgressRepository)    public casePatientProgressRepository : CasePatientProgressRepository,
  ) {}

  @post('/companies/{companyID}/cases/{caseID}/patientProgress', {
    responses: {
      '200': {
        description: 'CasePatientProgress model instance',
        content: {'application/json': {schema: {'x-ts-type': CasePatientProgress}}},
      },
    },
  })
  async create(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() casePatientProgress: CasePatientProgress): Promise<CasePatientProgress> {
      // Ensure that the provided CasePatientProgress has a caseID that matches the path caseID
      if (casePatientProgress.caseID != caseID) { throw new HttpErrors.BadRequest("CasePatientProgress.caseID does not match the URL path caseID"); }

      // Make sure that now other CasePatientProgress records exist for this caseID
      let recordCount : Count = await this.casePatientProgressRepository.count( { caseID : caseID } );
      if ( recordCount.count > 0 ) { throw new HttpErrors.BadRequest("A CasePatientProgress record already exists for a Case with caseID : " + caseID); }

      // Create the CasePatientProgress
      return await this.casePatientProgressRepository.create(casePatientProgress);
  }

  @get('/companies/{companyID}/cases/{caseID}/patientProgress', {
    responses: {
      '200': {
        description: 'Array of CasePatientProgress model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CasePatientProgress}},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @param.query.object('filter', getFilterSchemaFor(CasePatientProgress)) filter?: Filter,
  ): Promise<CasePatientProgress[]> {
    // Create a basic filter if the filter argument is blank
    if (filter === undefined || filter == null || filter.where === undefined || filter.where == null) {
      filter = { where: { caseID: caseID } }; 
    }

    return await this.casePatientProgressRepository.find(filter);
  }

  @patch('/companies/{companyID}/cases/{caseID}/patientProgress', {
    responses: {
      '200': {
        description: 'CasePatientProgress PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async update(
    @param.path.string('companyID') companyID: string,
    @param.path.string('caseID') caseID: string,
    @requestBody() casePatientProgress: CasePatientProgress
  ): Promise<boolean> {
    // Ensure that the provided CasePatientProgress has a caseID that matches the path caseID
    if (casePatientProgress.caseID != caseID) { throw new HttpErrors.BadRequest("CasePatientProgress.caseID does not match the URL path caseID"); }

    // Check if this Case already has a CasePatientProgress
    let recordCount : Count = await this.casePatientProgressRepository.count( { caseID : caseID } );

    // Create or Update the CasePatientProgress based on whether it exists already
    if (recordCount.count == 0) {
      let savedProgress : CasePatientProgress = await this.casePatientProgressRepository.create(casePatientProgress);
      return true;
    } else {
      let updatedProgresses : Count = await this.casePatientProgressRepository.updateAll(casePatientProgress, { caseID : caseID });
      return (updatedProgresses.count == 1);
    }
  }


}
