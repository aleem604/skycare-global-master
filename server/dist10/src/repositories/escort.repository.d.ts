import { DefaultCrudRepository } from '@loopback/repository';
import { Escort } from '../models';
import { CloudantDataSource } from '../datasources';
export declare class EscortRepository extends DefaultCrudRepository<Escort, typeof Escort.prototype.escortID> {
    constructor(dataSource: CloudantDataSource);
}
