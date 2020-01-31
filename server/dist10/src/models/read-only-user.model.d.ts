import { Entity } from '@loopback/repository';
export declare class ReadOnlyUser extends Entity {
    externalAccessID: string;
    email: string;
    caseID: string;
    constructor(data?: Partial<ReadOnlyUser>);
}
