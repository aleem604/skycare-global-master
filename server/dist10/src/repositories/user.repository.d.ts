import { DefaultCrudRepository } from '@loopback/repository';
import { User } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class UserRepository extends DefaultCrudRepository<User, typeof User.prototype.userID> {
    private nexmo;
    constructor(dataSource: CloudantDataSource);
    create2FARequestForUser(user: User): Promise<string>;
    verify2FARequestForUser(user: User, verificationCode: string): Promise<string>;
    cancelPending2FARequestForUser(user: User): Promise<string>;
    cancelSpecific2FARequest(requestID: string): Promise<string>;
}
