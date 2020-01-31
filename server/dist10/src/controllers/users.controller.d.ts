import { UserProfile } from '@loopback/authentication';
import { User, CredentialReset } from '../models';
import { UserRepository, LoginAttemptRepository, CredentialResetRepository, CompanyRepository, CompanyUserRepository, EscortRepository } from '../repositories';
export declare class UsersController {
    private user;
    userRepository: UserRepository;
    loginAttemptRepository: LoginAttemptRepository;
    credentialResetRepository: CredentialResetRepository;
    companyRepository: CompanyRepository;
    companyUserRepository: CompanyUserRepository;
    escortRepository: EscortRepository;
    constructor(user: UserProfile, userRepository: UserRepository, loginAttemptRepository: LoginAttemptRepository, credentialResetRepository: CredentialResetRepository, companyRepository: CompanyRepository, companyUserRepository: CompanyUserRepository, escortRepository: EscortRepository);
    create(user: User): Promise<User>;
    login(credentials: string, rememberMe: boolean): Promise<boolean>;
    sendNew2FAPINCode(): Promise<string>;
    complete2FA(verificationCode: string): Promise<string>;
    beginCredentialReset(reset: CredentialReset): Promise<boolean>;
    finishCredentialReset(reset: CredentialReset): Promise<boolean>;
    checkCredentialResetIsActive(resetID: string): Promise<boolean>;
    emailAddressAvailable(emailAddress: string, resetID?: string, credentials?: string): Promise<string>;
    findById(id: string): Promise<User>;
    updateById(id: string, user: User): Promise<void>;
    delete(usersToDelete: string): Promise<void>;
    ping(): void;
}
