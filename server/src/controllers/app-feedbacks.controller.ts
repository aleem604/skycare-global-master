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
import {AppFeedback} from '../models';
import {AppFeedbackRepository} from '../repositories';
import { authenticate } from '@loopback/authentication';

export class AppFeedbacksController {

  constructor(
    @repository(AppFeedbackRepository) public appFeedbackRepository : AppFeedbackRepository,
  ) {}

  @post('/app-feedbacks', {
    responses: {
      '200': {
        description: 'AppFeedback model instance',
        content: {'application/json': {schema: {'x-ts-type': AppFeedback}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(@requestBody() appFeedback: AppFeedback): Promise<AppFeedback> {
    return await this.appFeedbackRepository.create(appFeedback);
  }

  @get('/app-feedbacks', {
    responses: {
      '200': {
        description: 'Array of AppFeedback model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': AppFeedback}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find( @param.query.object('filter', getFilterSchemaFor(AppFeedback)) filter?: Filter ): Promise<AppFeedback[]> {
    return await this.appFeedbackRepository.find(filter);
  }

}
