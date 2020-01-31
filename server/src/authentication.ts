import { Provider, inject, ValueOrPromise } from '@loopback/context';
import { Strategy } from 'passport';
import {
  AuthenticationBindings,
  AuthenticationMetadata,
  UserProfile,
} from '@loopback/authentication';
import { repository, Filter, Where, Count } from '@loopback/repository';
import { BasicStrategy } from 'passport-http';
import { Strategy as JWTStrategy, StrategyOptions, ExtractJwt } from 'passport-jwt';
import { UserRepository, LoginAttemptRepository, ReadOnlyUserRepository } from './repositories';
import { User, LoginAttempt, ReadOnlyUser } from './models';
import { Config } from './config';
import { Request } from 'express';

const CustomStrategy = require('passport-custom').Strategy;
const uuid62 = require('uuid62');
const Nexmo = require('nexmo');

export class AuthStrategyProvider implements Provider<Strategy | undefined> {

  private nexmo : any;
  private USING_2FA : boolean = (process.env.USING_2FA && process.env.USING_2FA == 'false') ? false : true;

  constructor(
    @inject(AuthenticationBindings.METADATA)    private metadata: AuthenticationMetadata,
    @repository(UserRepository)                 protected userRepository : UserRepository,
    @repository(LoginAttemptRepository)         protected loginAttemptRepository : LoginAttemptRepository,
    @repository(ReadOnlyUserRepository)         protected readOnlyUserRepository : ReadOnlyUserRepository
  ) {
    // Configure the Nexmo services
    this.nexmo = new Nexmo({ apiKey: process.env.NEXMO_API_KEY, apiSecret: process.env.NEXMO_API_SECRET}, {debug: true});
  }

  value(): ValueOrPromise<Strategy | undefined> {
    // The function was not decorated, so we shouldn't attempt authentication
    if (!this.metadata) {
      return undefined;
    }

    const name = this.metadata.strategy;
    if (name === 'BasicStrategy') {
        return new BasicStrategy(this.verifyEmailPass.bind(this));
    } else if (name === 'LimitedStrategy') {
        return new CustomStrategy(this.verifyCustom.bind(this));
    } else if (name === 'JWTStrategy') {
        let options : StrategyOptions = {
            secretOrKey: Config.jwt.encryptingKey,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: Config.jwt.issuer,
            audience: Config.jwt.audience,
            algorithms: [ Config.jwt.algorithm ],
            ignoreExpiration: false,
            passReqToCallback: false
        };
        return new JWTStrategy(options, this.verifyJWT.bind(this));
    } else {
      return Promise.reject(`The strategy ${name} is not available.`);
    }
  }

  async verifyEmailPass(
    email: string,
    password: string,
    cb: (err: Error | null, user?: UserProfile | false) => void,
  ) {

    // Verify email and password were provided
    if(email.length == 0){
        console.log('SKYCARE BASIC AUTH - Email is a required argument');
        cb(null, false); 
        return;
    }
    if(password.length == 0){
        console.log('SKYCARE BASIC AUTH - Password is a required argument');
        cb(null, false); 
        return;
    }

    // find user by name & password
    this.userRepository.findOne({ where : { email : email.toLowerCase() } }).then(
        async (user : User | null) => {    
            if (!user){
                // user not found
                console.log('SKYCARE BASIC AUTH - Email does not exist');
                cb(null, false); 
            } else {
                // Check LoginAttempts for 5 failed logins in 24 hours
                let loginAttemptFilter : Filter<LoginAttempt> = {
                    where: { email: email.toLowerCase() },
                    limit: 5
                } as Filter<LoginAttempt>;
                let loginAttempts : LoginAttempt[] = await this.loginAttemptRepository.find(loginAttemptFilter);
                let rightNow : number = Date.now();
                let oneDayAgo : number = rightNow - (24 * 60 * 60 * 1000);
                let tooManyLoginAttempts : boolean = loginAttempts.every(
                    (value:LoginAttempt, index:number, array:LoginAttempt[]) => {
                        return (Date.parse(value.loginDate) > oneDayAgo);
                    }
                );
            
                // If we have crossed this threshold, then respond with an error
                if (tooManyLoginAttempts && loginAttempts.length == 5) {
                    console.log('SKYCARE BASIC AUTH - Exceeded 5 failed logins in a 24-hour period');
                    cb(null, false);
                } else {
                    if (user.password !== password) {
                        let failedLoginAttempt : LoginAttempt = {
                            email: email.toLowerCase(),
                            loginDate: (new Date()).toISOString(),
                            loginAttemptID: uuid62.v4()
                          } as LoginAttempt;
                        await this.loginAttemptRepository.create(failedLoginAttempt);
                        console.log('SKYCARE BASIC AUTH - Password is incorrect');
                        cb(null, false);
                    } else {
                        if (this.USING_2FA) {
                            // Cancel any pending 2FA requests for this user
                            let cancelSuccess : string = await this.userRepository.cancelPending2FARequestForUser(user);
                            if (cancelSuccess != 'SUCCESS') { 
                                cb(new Error('Failed to cancel a pending 2FA request for the User'), false);
                                return;
                            }

                            // Create the new 2FA request for this user
                            let createSuccess : string = await this.userRepository.create2FARequestForUser(user);
                            if (createSuccess != 'SUCCESS') { 
                                cb(new Error('Failed to create a new 2FA request for the User'), false);
                                return;
                            }
                        }

                        // Return the UserProfile for this User
                        cb(null, {
                            id: user.userID,
                            name: user.name,
                            email: user.email.toLowerCase(),
                            role: user.role,
                            using2FA: (user.phoneNumber.length > 0 && this.USING_2FA)
                        } as UserProfile);                  
                    }
                }
            }
        }
    );
  }


  async verifyCustom(
      req: Request,
      cb: (err: Error | null, user?: UserProfile | false) => void
  ) {
    console.log('debug');
    const customToken = req.url.substring(req.url.lastIndexOf('/')+1);

    try {
        // Try to retrieve the ReadOnlyUser in the database
        let savedReadyOnlyUser : ReadOnlyUser = await this.readOnlyUserRepository.findById(customToken);

        // Create a fake UserProfile for this User
        cb(null, {
            id: customToken,
            name: 'Limited User',
            email: 'limited@skycareglobal.com',
            role: 'limited',
            caseID: savedReadyOnlyUser.caseID,
            using2FA: false
        } as UserProfile);  

    } catch (err) {
        console.log('SKYCARE CUSTOM AUTH - Provided access token is not valid');
        cb(null, false);
    }
  }


  verifyJWT(
      jwtPayload: any,
      cb: (err: Error | null, user?: UserProfile | false) => void,
  ) {

    if (jwtPayload.role == 'limited') {
        // Create a fake UserProfile for this User
        cb(null, {
            id: jwtPayload.sub,
            name: jwtPayload.name,
            email: jwtPayload.email,
            role: jwtPayload.role,
            caseID: jwtPayload.caseID,
            using2FA: false
        } as UserProfile);  
    } else {
        // find user by name & password
        this.userRepository.findOne({ where : { userID : jwtPayload.sub } }).then(
            (user : User | null) => {    
                if (!user) {
                    // call cb(null, false) when user not found
                    cb(null, false);
                } else {
                    // call cb(null, user) when user is authenticated
                    cb(null, {
                        id: user.userID,
                        name: user.name,
                        email: user.email.toLowerCase(),
                        role: user.role,
                        using2FA: (user.phoneNumber.length > 0 && this.USING_2FA)
                    } as UserProfile);
                }
            }
        );
    }
  }
}