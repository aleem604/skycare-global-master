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
import {inject} from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';
import {Company,User} from '../models';
import {CompanyRepository,UserRepository} from '../repositories';


export class CompaniesController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER)    private user: UserProfile,
    @repository(CompanyRepository)                  public companyRepository : CompanyRepository,
    @repository(UserRepository)                     public userRepository : UserRepository,
  ) {}

  @get('/companies', {
    responses: {
      '200': {
        description: 'Array of Company model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Company}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.query.object('filter', getFilterSchemaFor(Company)) filter?: Filter,
  ): Promise<Company[]> {
    return await this.companyRepository.find(filter);
  }

  @get('/companies/{companyID}', {
    responses: {
      '200': {
        description: 'Company model instance',
        content: {'application/json': {schema: {'x-ts-type': Company}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async findById(@param.path.string('companyID') companyID: string): Promise<Company> {
    return await this.companyRepository.findById(companyID);
  }

  @patch('/companies/{companyID}', {
    responses: {
      '204': {
        description: 'Company PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(
    @param.path.string('companyID') companyID: string,
    @requestBody() company: Company,
  ): Promise<boolean> {
    // Update the Company Profile by its ID
    await this.companyRepository.updateById(companyID, company);

    // Get the User record from the database for the current User
    let currentUser : User = await this.userRepository.findById(this.user.id);

    // Update the User record with the same name that was provided as part of the Company Profile
    currentUser.name = company.name;

    // Update the User record in the database
    await this.userRepository.updateById(currentUser.userID, currentUser);

    return true;
  }

}
