import { Entity, ValueObject } from '@loopback/repository';
export declare class User extends Entity {
    userID: string;
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: string;
    key2FA?: string;
    emailVerified?: boolean;
    companyName?: string;
    constructor(data?: Partial<User>);
}
export declare class UserDeletes extends ValueObject {
    userIDs: string[];
}
