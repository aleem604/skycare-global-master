import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {LoginAttempt} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class LoginAttemptRepository extends DefaultCrudRepository<
  LoginAttempt,
  typeof LoginAttempt.prototype.loginAttemptID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(LoginAttempt, dataSource);
  }
}
