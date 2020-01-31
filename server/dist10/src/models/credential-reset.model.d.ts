import { Entity } from '@loopback/repository';
export declare class CredentialReset extends Entity {
    credentialResetID?: string;
    email: string;
    newEmail?: string;
    newPassword?: string;
    newPhoneNumber?: string;
    userID?: string;
    timestamp?: string;
    constructor(data?: Partial<CredentialReset>);
}
