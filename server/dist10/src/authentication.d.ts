import { Provider, ValueOrPromise } from '@loopback/context';
import { Strategy } from 'passport';
import { AuthenticationMetadata, UserProfile } from '@loopback/authentication';
import { UserRepository, LoginAttemptRepository, ReadOnlyUserRepository } from './repositories';
import { Request } from 'express';
export declare class AuthStrategyProvider implements Provider<Strategy | undefined> {
    private metadata;
    protected userRepository: UserRepository;
    protected loginAttemptRepository: LoginAttemptRepository;
    protected readOnlyUserRepository: ReadOnlyUserRepository;
    private nexmo;
    private USING_2FA;
    constructor(metadata: AuthenticationMetadata, userRepository: UserRepository, loginAttemptRepository: LoginAttemptRepository, readOnlyUserRepository: ReadOnlyUserRepository);
    value(): ValueOrPromise<Strategy | undefined>;
    verifyEmailPass(email: string, password: string, cb: (err: Error | null, user?: UserProfile | false) => void): Promise<void>;
    verifyCustom(req: Request, cb: (err: Error | null, user?: UserProfile | false) => void): Promise<void>;
    verifyJWT(jwtPayload: any, cb: (err: Error | null, user?: UserProfile | false) => void): void;
}
