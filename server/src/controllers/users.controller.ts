import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  Model,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  del,
  requestBody,
  HttpErrors,
  Response,
  SchemaObject,
  JsonSchema,
  jsonToSchemaObject
} from '@loopback/rest';
import {inject} from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';
import {User, LoginAttempt, CredentialReset, Company, CompanyUser, Escort, UserDeletes} from '../models';
import {UserRepository, LoginAttemptRepository, CredentialResetRepository, CompanyRepository, CompanyUserRepository, EscortRepository} from '../repositories';
import { Config } from '../config';
import { decode } from 'jwt-simple';

const uuid62 = require('uuid62');
const sendgrid = require('@sendgrid/mail');


export class UsersController {

  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: UserProfile,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @repository(LoginAttemptRepository)
    public loginAttemptRepository : LoginAttemptRepository,
    @repository(CredentialResetRepository)
    public credentialResetRepository : CredentialResetRepository,
    @repository(CompanyRepository)
    public companyRepository : CompanyRepository,
    @repository(CompanyUserRepository)
    public companyUserRepository : CompanyUserRepository,
    @repository(EscortRepository)
    public escortRepository : EscortRepository,
  ) {
    // Configure our API services
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: {'x-ts-type': User}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async create(@requestBody() user: User): Promise<User> {
    // Make sure the requesting user is an Admin

    // Store the new User in the database
    let newUser : User = await this.userRepository.create(user);

    // Create the additional records needed for the CLIENT and ESCORT user types
    if (user.role == 'client') {
      // Create a new Company
      let company : Company = new Company({
        companyID: uuid62.v4(),
        name: user.companyName,
        emailForInvoices: user.email
      });

      // Store the new Company in the database
      let newCompany : Company = await this.companyRepository.create(company);

      // Create a new CompanyUser
      let companyUser : CompanyUser = new CompanyUser({
        companyUserID: uuid62.v4(),
        companyID: company.companyID,
        userID: newUser.userID,
        lastLogin: (new Date()).toISOString()
      });

      // Store the new CompanyUser in the database
      let newCompanyUser : CompanyUser = await this.companyUserRepository.create(companyUser);
    } else if (user.role == 'escort') {
      // Create a new Escort
      let escort : Escort = new Escort({
        escortID: uuid62.v4(),
        userID: user.userID,
        name: user.name
      });

      // Store the new Escort in the database
      let newEscort : Escort = await this.escortRepository.create(escort);
    }

    // Create a CredentialReset for the new User
    let credentialReset : CredentialReset = new CredentialReset({
      email : newUser.email.toLowerCase(),
      credentialResetID: uuid62.v4(),
      userID: newUser.userID,
      timestamp: (new Date()).toISOString()
    });
    let newCredentialReset = await this.credentialResetRepository.create(credentialReset);

    // Send an email to the new User, inviting them to setup their account
    const emailMessage = {
      to: newUser.email.toLowerCase(),
      from: Config.email.newUserInvitation.fromEmail,
      templateId: Config.email.newUserInvitation.templateID,
      dynamic_template_data: {
        SETUP_USER_ACCOUNT_LINK: process.env.MAIN_URL + Config.email.newUserInvitation.linkBaseURL + newCredentialReset.credentialResetID
      }
    }
    sendgrid.send(emailMessage);

    newUser.password = '';
    newUser.key2FA = '';
    return newUser;
  }

  
  @post('/login', {
    responses: {
      '200': {
        description: 'Login a user and return a JWT',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    }
  })
  @authenticate('BasicStrategy')
  async login(@param.header.string('Authorization') credentials : string,
              @param.query.boolean('rememberMe') rememberMe : boolean): Promise<boolean> {
    // Base64-decode the credentials into email:password
    let encodedEmailPass : string = credentials.substr(credentials.indexOf(' ')+1);
    let decodedEmailPass : string = new Buffer(encodedEmailPass, 'base64').toString('utf8');
    let email : string = decodedEmailPass.split(':')[0].toLowerCase();
    let password : string = decodedEmailPass.split(':')[1];

    // Create a search clause for looking up the user in the database
    let countWhere : Where<User> = {
      email: email,
      password: password
    };
    let userCount = await this.userRepository.count(countWhere);

    // Success if the User was located
    return userCount.count > 0;
  }


  @post('/sendNew2FAPINCode', {
    responses: {
      '200': {
        description: 'Send a new 2FA PIN code to the User so they can complete their login',
        content: {'text/plain': {schema: {type: 'string'}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  sendNew2FAPINCode(): Promise<string> {
    return new Promise<string>(
      async (resolve, reject) => {
        // Lookup the user in the database, using the ID resolved from the JWT
        let completeUser : User = await this.userRepository.findById(this.user.id);

        // Cancel any pending 2FA requests for this user
        let cancelSuccess : string = await this.userRepository.cancelPending2FARequestForUser(completeUser);
        if (cancelSuccess == 'ERROR') { resolve('ERROR'); }

        // Create the new 2FA request for this user
        let createSuccess : string = await this.userRepository.create2FARequestForUser(completeUser);
        resolve(createSuccess);
      }
    );
  }




  @post('/complete2FA/{verificationCode}', {
    responses: {
      '200': {
        description: 'Complete the 2FA process for a User login',
        content: {'text/plain': {schema: {type: 'string'}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  complete2FA(@param.path.string('verificationCode') verificationCode: string): Promise<string> {
    return new Promise<string>(
      async (resolve, reject) => {
        // Lookup the user in the database, using the ID resolved from the JWT
        let completeUser : User = await this.userRepository.findById(this.user.id);

        // Check the 2FA login
        let verifySuccess : string = await this.userRepository.verify2FARequestForUser(completeUser, verificationCode);
        resolve(verifySuccess);
      }
    );
  }


  @post('/beginCredentialReset', {
    responses: {
      '200': {
        description: 'Request email / password reset for a user',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    }
  })
  async beginCredentialReset(@requestBody() reset : CredentialReset): Promise<boolean> {
    // Lookup the email address in the User table
    let userFilter : Filter<User> = { where: {email: reset.email.toLowerCase() }};
    let discoveredUser: User | null = await this.userRepository.findOne(userFilter);
    
    // If we located a User, then populate the CredentialReset object
    if (discoveredUser) {
      reset.credentialResetID = uuid62.v4();
      reset.userID = discoveredUser.userID;
      reset.timestamp = (new Date()).toISOString();

      // Save the CredentialReset object
      let createdReset: CredentialReset = await this.credentialResetRepository.create(reset);
        
      // Send the requesting User an email that will allow them to finish the CredentialReset process
      const emailMessage = {
        to: createdReset.email.toLowerCase(),
        from: Config.email.credentialReset.fromEmail,
        templateId: Config.email.credentialReset.templateID,
        dynamic_template_data: {
          RESET_LINK: process.env.MAIN_URL + Config.email.credentialReset.linkBaseURL + createdReset.credentialResetID
        }
      }
      sendgrid.send(emailMessage);

      // Return a success indicator
      return true;          
    } else {
      // If we did not locate a User, then return a failure indicator
      return false;
    }  
  }


  @post('/finishCredentialReset', {
    responses: {
      '200': {
        description: 'Reset the email / password for a user and return success / failure',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    }
  })
  finishCredentialReset(@requestBody() reset : CredentialReset): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      // Lookup the credentialResetID to make sure we have a valid session
      let resetFilter : Filter<CredentialReset> = { where: { credentialResetID: reset.credentialResetID }};
      let discoveredReset:CredentialReset|null = await this.credentialResetRepository.findOne(resetFilter);
        
      if (discoveredReset) {
        // If we found a valid session, lookup the User associated with it
        let userFilter : Filter<User> = { where: { userID: discoveredReset.userID }};
        let user:User|null = await this.userRepository.findOne(userFilter);
          
        if (user) {
          // Update the user with details from the CredentialReset
          if (reset.newPassword) { user.password = reset.newPassword; }
          if (reset.email) { user.email = reset.email.toLowerCase(); }
          if (reset.newPhoneNumber) { user.phoneNumber = reset.newPhoneNumber; }
  
          // Store the updated User in the database
          await this.userRepository.update(user);
  
          // Delete the CredentialReset record for this User
          await this.credentialResetRepository.deleteById(reset.credentialResetID);
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    })
  }


  @get('/finishCredentialReset/{resetID}', {
    responses: {
      '200': {
        description: 'Verify that a Reset Session is still active and return success / failure',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    }
  })
  checkCredentialResetIsActive(@param.path.string('resetID') resetID: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      // Lookup the credentialResetID to make sure we have a valid session
      let resetFilter : Filter<CredentialReset> = { where: { credentialResetID: resetID }};
      let discoveredReset:CredentialReset|null = await this.credentialResetRepository.findOne(resetFilter);

      if (discoveredReset) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }


  @get('/users', {
    responses: {
      '200': {
        description: 'Verify if an email address is available',
        content: {'text/plain': {schema: {type: 'string'}}},
      },
    },
  })
  emailAddressAvailable(@param.query.string('email') emailAddress : string,                       
                        @param.query.string('resetID') resetID? : string,
                        @param.header.string('Authorization') credentials? : string) : Promise<string> {
    
    return new Promise<string>(
      async (resolve, reject) => {
      
        let authorizedUserID : string = '';
        
        if (credentials && credentials.trim().length > 0 && credentials.indexOf('Bearer null') == -1 && credentials !== 'Bearer'){
          // If they supplied the JWT , then we prefer this to determine the authorizedUserID
          if (credentials.indexOf('Bearer') == -1) {
            console.log('EMAIL SEARCH ERROR - Credentials are provided, but they are missing Bearer');
            resolve('ACCESS_DENIED');
          } else {
            let jwt : string = credentials.substr(credentials.indexOf(' ') + 1);
            
            try {
              let token : any = decode(jwt, Config.jwt.encryptingKey, false, Config.jwt.algorithm);
              authorizedUserID = token.sub;
            } catch (err) {
              console.log('EMAIL SEARCH ERROR - Invalid JWT : INNER ERROR = ' + err);
              resolve('ACCESS_DENIED');
            }
          }
        } else if (resetID && resetID.trim().length > 0) {
          // If they supplied a resetID, get the associated UserID from the CredentialReset table
          let resetUserSearch : Filter<CredentialReset> = { where: {credentialResetID: resetID} };
          let resetUser : CredentialReset|null = await this.credentialResetRepository.findOne(resetUserSearch);

          // This is only a valid authorized user if we found this CredentialReset, and there is a valid userID associated with the CredentialReset
          if (resetUser && resetUser.userID) {
            authorizedUserID = resetUser.userID;
          } else {
            console.log('EMAIL SEARCH ERROR - Reset credential provides, but it is not associated with a UserID.  UserID = ' + ((resetUser)?((resetUser.userID)?resetUser.userID:'undefined'):'resetUserUndefined'));
            resolve('ACCESS_DENIED');
          }
        } else {
          console.log('EMAIL SEARCH ERROR - Neither Credentials or Reset ID were provided');
          resolve('ACCESS_DENIED');
        }

        // Create a search filter for email addresses with the provided email address
        let emailSearch : Filter<User> = { where: { email: emailAddress.toLowerCase() } };
        let discoveredUsers : User[] = await this.userRepository.find(emailSearch);

        // Email address is available if there are no associated User, or only associated User is the authorizedUserID
        if (discoveredUsers.length == 0 || discoveredUsers[0].userID == authorizedUserID) {
          resolve('AVAILABLE');
        } else {          
          console.log('EMAIL SEARCH ERROR - Another User, other than the current Authorized User, as this email.  AuthorizedUserID = ' + authorizedUserID + ', FirstDiscoveredUserID = ' + discoveredUsers[0].userID);
          resolve('NOT_AVAILABLE');
        }
    })
  }

  @get('/users/{id}', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: {'x-ts-type': User}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async findById(@param.path.string('id') id: string): Promise<User> {
    return await this.userRepository.findById(id);
  }

  @patch('/users/{id}', {
    responses: {
      '204': {
        description: 'User PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(@param.path.string('id') id: string, @requestBody() user: User): Promise<void> {

    // Ensure the requesting user is permitted to do this operation
    // Throw errors if the userID's do not match
    if (this.user.id != id) {
      throw new HttpErrors.Unauthorized('JWT User is not permitted to access this User data');
    }

    await this.userRepository.updateById(id, user);
  }


  @del('/users', {
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async delete(@param.query.string('usersToDelete') usersToDelete : string): Promise<void> {
    let userIDs : string[] = usersToDelete.split(',');

    let userCriteria : any[] = userIDs.map( (v,i,l)=>{ return { userID : v }});
    let userWhere : Where = { or: userCriteria };
    let users : User[] = await this.userRepository.find( { where: userWhere } );

    let companyUserCriteria : any[] = users.filter( (v,i,l)=>{ return v.role == 'client'; })
                                           .map( (vx,ix,lx)=>{ return { userID: vx.userID }; });
    
    if (companyUserCriteria.length > 0) {
      let companyUserWhere : Where = { or: companyUserCriteria };
      let deletedCompanyUsers : Count = await this.companyUserRepository.deleteAll(companyUserWhere);
      console.log('Want to delete ' + companyUserCriteria.length + ' company users');
      console.log('Actually deleted ' + deletedCompanyUsers.count + ' company users');
    }
    
    let deletedUsers : Count = await this.userRepository.deleteAll(userWhere);
    console.log('Want to delete ' + userCriteria.length + ' users');
    console.log('Actually deleted ' + deletedUsers.count + ' users');
  }



  @get('/ping', {
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  ping() : void { return; }




}

