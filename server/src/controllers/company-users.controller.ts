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
import {CompanyUser, User, Company} from '../models';
import {CompanyUserRepository, UserRepository, CompanyRepository} from '../repositories';

export class CompanyUsersController {
  constructor(
    @repository(CompanyUserRepository)  public companyUserRepository : CompanyUserRepository,
    @repository(CompanyRepository)      public companyRepository : CompanyRepository,
    @repository(UserRepository)         public userRepository : UserRepository,

  ) {}

  @post('/company-users', {
    responses: {
      '200': {
        description: 'CompanyUser model instance',
        content: {'application/json': {schema: {'x-ts-type': CompanyUser}}},
      },
    },
  })
  async create(@requestBody() companyUser: CompanyUser): Promise<CompanyUser> {
    return await this.companyUserRepository.create(companyUser);
  }

  @get('/company-users/count', {
    responses: {
      '200': {
        description: 'CompanyUser model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(CompanyUser)) where?: Where,
  ): Promise<Count> {
    return await this.companyUserRepository.count(where);
  }

  @get('/company-users', {
    responses: {
      '200': {
        description: 'Array of CompanyUser model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': CompanyUser}},
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(CompanyUser)) filter?: Filter,
  ): Promise<CompanyUser[]> {
    let companyUsers : CompanyUser[] = await this.companyUserRepository.find(filter);
    if (companyUsers.length == 0) { return companyUsers; }

    let userCriteria : any[] = companyUsers.map( (v,i,l) => { return { userID: v.userID } });
    let userFilter : Filter = { where: { or: userCriteria } };
    let users : User[] = await this.userRepository.find(userFilter);

    for (let ix = 0; ix < companyUsers.length; ix++) {
      let userIndex : number = users.findIndex( (v,i,l)=>{ return v.userID == companyUsers[ix].userID; });
      if (userIndex > -1) {
        users[userIndex].password = '';
        users[userIndex].key2FA = '';
        companyUsers[ix].user = users[userIndex];
      }
    }

    let companyCriteria : any[] = companyUsers.map( (v,i,l) => { return { companyID: v.companyID } });
    let companyFilter : Filter = { where: { or: companyCriteria } };
    let companies : Company[] = await this.companyRepository.find(companyFilter);

    for (let ix = 0; ix < companyUsers.length; ix++) {
      let companyIndex : number = companies.findIndex( (v,i,l)=>{ return v.companyID == companyUsers[ix].companyID; });
      if (companyIndex > -1) {
        companyUsers[ix].company = companies[companyIndex];
      }
    }

    return companyUsers;
  }

  @patch('/company-users', {
    responses: {
      '200': {
        description: 'CompanyUser PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody() companyUser: CompanyUser,
    @param.query.object('where', getWhereSchemaFor(CompanyUser)) where?: Where,
  ): Promise<Count> {
    return await this.companyUserRepository.updateAll(companyUser, where);
  }

  @get('/company-users/{id}', {
    responses: {
      '200': {
        description: 'CompanyUser model instance',
        content: {'application/json': {schema: {'x-ts-type': CompanyUser}}},
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<CompanyUser> {
    return await this.companyUserRepository.findById(id);
  }

  @patch('/company-users/{id}', {
    responses: {
      '204': {
        description: 'CompanyUser PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() companyUser: CompanyUser,
  ): Promise<void> {
    await this.companyUserRepository.updateById(id, companyUser);
  }

  @del('/company-users/{id}', {
    responses: {
      '204': {
        description: 'CompanyUser DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.companyUserRepository.deleteById(id);
  }
}
