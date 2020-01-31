import { Entity } from '@loopback/repository';
export declare class LoginAttempt extends Entity {
    loginAttemptID: string;
    email: string;
    loginDate: string;
    constructor(data?: Partial<LoginAttempt>);
}
