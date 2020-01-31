import { DefaultCrudRepository } from '@loopback/repository';
import { LoginAttempt } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class LoginAttemptRepository extends DefaultCrudRepository<LoginAttempt, typeof LoginAttempt.prototype.loginAttemptID> {
    constructor(dataSource: CloudantDataSource);
}
