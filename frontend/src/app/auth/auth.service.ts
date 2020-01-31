import { Injectable } from '@angular/core';
import * as JWTDecode from 'jwt-decode';
import { 
  UsersControllerService, 
  CredentialReset, 
  User, 
  EscortsControllerService, 
  CompanyUsersControllerService, 
  Escort, 
  CompanyUser, 
  CompaniesControllerService, 
  Company, 
  Filter,
  AppFeedback} from '../apiClient';
import { Observable, BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { map, mergeMap, catchError, timeout } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { Buffer } from 'buffer';
import { BaseService } from '../base.service';
import { NetworkMonitoringService } from '../netmon.service';
import { Dexie } from 'dexie';


const ACCESS_TOKEN_KEY : string = 'ACCESS_TOKEN';
const USING_2FA_KEY : string = 'USING_2FA';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {
  public currentlyLoggedIn:  BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public currentlyLoggedIn$: Observable<boolean> = this.currentlyLoggedIn.asObservable();
  public currentProfile : any = null;
  
  constructor(private userService : UsersControllerService,
              private escortService : EscortsControllerService,
              private companyUserService : CompanyUsersControllerService,
              private companyService : CompaniesControllerService,
              public readonly netmonService : NetworkMonitoringService) {
    super(netmonService, 'profile');
  }

  login(email : string, password : string, rememberMe : boolean = false) : Observable<any> {
    // Create the Basic Authentication header token ('Basic BASE64-ENCODE(email:password)')
    let authToken : string = 'Basic ' + (new Buffer(email+':'+password)).toString('base64');
    
    // Request login from the UserController
    return this.userService.loginPost(authToken, rememberMe, 'response').pipe(
      map((loginResponse:HttpResponse<boolean>) => {
        // If the loginResponse body contains 'true', then look in the response headers for the JWT
        if (loginResponse.body == true) {
          // Make sure the 'Authorization' header is in the response
          if (loginResponse.headers.has('Authorization')) {
            let authorizationResponse : string = loginResponse.headers.get('Authorization');
            let jwt : string = authorizationResponse.substr(authorizationResponse.indexOf(' ') + 1);
            
            // Check if we need to login with 2FA
            if (JWTDecode(jwt).using2FA) {
              // Store the JWT in a temp area of localStorage
              localStorage.setItem(USING_2FA_KEY, 'true');
              localStorage.setItem('TEMP-'+ACCESS_TOKEN_KEY, jwt);
            } else {
              // Store the JWT in localStorage
              localStorage.setItem(ACCESS_TOKEN_KEY, jwt);
            }

            this.currentlyLoggedIn.next(true);
            return {success: true, using2FA: JWTDecode(jwt).using2FA};
          } else {
            this.currentlyLoggedIn.next(false);
            return {success: false, using2FA: false};
          }
        } else {
          this.currentlyLoggedIn.next(false);
          return {success: false, using2FA: false};
        }
      }),
      catchError((err:any,caught:any) => {
        this.currentlyLoggedIn.next(false);
        if (err.status == 401) {
          return of({success: false, unauthorized: true, using2FA: false});
        } else {
          console.log(err);
          return of({success: false, unauthorized: false, using2FA: false});
        }
      })
    );
  }

  login2FA(pinCode : string) : Observable<string> {
    // Send the 2FA login to the Server
    return this.userService.complete2FAPost(pinCode).pipe(
      map((login2FASuccess:string) => {
        if(login2FASuccess == 'SUCCESS') {
          // Get the TEMP access token in storage and make it the LIVE access token in storage
          let tempAccessToken : string = this.getTempJWT();
          localStorage.setItem(ACCESS_TOKEN_KEY, tempAccessToken);
          localStorage.removeItem('TEMP-'+ACCESS_TOKEN_KEY);

          // Indicate the user is currently logged in, but delay this for 1 seconds
          setTimeout(() => { 
            this.currentlyLoggedIn.next(true); 
          }, 1000);          
        }
        return login2FASuccess;
      })
    );
  }

  sendNew2FAPINCode() : Observable<string> {
    // Send the request for a new 2FA PIN code to the Server
    return this.userService.sendNew2FAPINCodePost();
  }

  logout() : void { 
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USING_2FA_KEY);

    // Slow-down the logout process to avoid errors with updating UI elements
    setTimeout(() => { this.currentlyLoggedIn.next(false); }, 2000);    
  }

  setup2FA(useTOTP : boolean) : void {
    // Not required for SMS based 2FA
  }

  inviteUser(userType : string, name : string, email : string, phone : string, companyName : string = '') : Observable<boolean> {
    // Generate a random 16-character password (base36)
    let randomPassword : string = (Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10));

    // Create the User object (need to generate a random number for userID - UGLY)
    let userID : string = Math.round(Math.random()*100000000).toString();
    let newUser : User = {
      userID: userID,
      name: name,
      password: randomPassword,
      email: email,
      phoneNumber: phone.toString(),
      role: userType,
      key2FA: '',
      companyName: companyName
    } as User;

    // Send the User to the server and wait for a response
    return this.userService.usersPost(newUser).pipe(
      map((createdUser:any, recordsAffected:number) => {
        // Return an indicator of success or failure
        return (createdUser && createdUser.userID && createdUser.userID.trim().length > 0);
      })
    );    
  }

  updateCredentials(resetID:string, newPassword:string, newEmail:string, newPhone:string) : Observable<boolean>{
    // Create the CredentialReset
    let credentialReset : CredentialReset = {
      credentialResetID: resetID, 
      newPassword : newPassword,
      newPhoneNumber : newPhone.replace('+', ''),
      email : newEmail
    };

    // Update the user account on the server
    return this.userService.finishCredentialResetPost(credentialReset).pipe(
      mergeMap((successfullyUpdated:boolean) => {

        if (successfullyUpdated) {
          this.logout();

          // Login with the new credentials
          return this.login(newEmail, newPassword).pipe(
            mergeMap((loginResponse:any) => {
              return of(loginResponse.success);
            })
          );
        } else {
          return of(successfullyUpdated);
        }
      })
    );
  }

  resetPassword(email:string) : Observable<boolean> {
    return this.userService.beginCredentialResetPost({email:email});
  }

  getLoggedInObservable(): Observable<boolean> {
    return (this.currentlyLoggedIn$);
  }

  emailAddressAvailable(email:string, resetID?:string) : Observable<string> {
    return this.userService.usersGet(email, resetID);
  }

  checkResetID(resetID : string) : Observable<boolean> {
    // Lookup the credential reset session on the server
    return this.userService.finishCredentialResetResetIDGet(resetID);
  }

  async loadProfile() : Promise<Observable<any>> {
    console.log('STAGE: Load Profile - Current Role = "' + this.getRole() + '"');
    if (this.getRole() == 'admin' || this.getRole() == 'limited' || this.getRole() == '') { return of(null); }
    return (await this.getProfile()).pipe( 
      map((profiles) => { 
        this.currentProfile = profiles[0];
        return profiles[0];
      })
    );
  }

  async getProfile() : Promise<Observable<any[]>> {

    let offlineRequest : (table:Dexie.Table<any,any>)=>Dexie.Collection<any,string> = (table)=>{
      let filteredData : Dexie.Collection<any,string> = table.filter( (v)=>{ return v.user.userID == this.getUserID() && v.user.role == this.getRole(); });
      return filteredData;
    }

    let keyIndexer : (dataset:any[])=>string[] = (dataset)=>{ return dataset.map((v,i,l)=>{ return v.userID; })};

    switch (this.getRole()) {
      case 'escort':
        let escortOnlineRequest : ()=>Observable<any> = ()=>{
          let escortsFilter : Filter = {where:{userID:this.getUserID()}};
          return this.escortService.escortsGet(escortsFilter).pipe(
            map((escorts:Escort[]|null|undefined) => {
              if (escorts == null || escorts == undefined || escorts.length == 0) {
                throwError(new Error('Failed to locate the Escort Profile for the current User.  UserID : ' + this.getUserID()));
              } else if (escorts.length > 1) {
                throwError(new Error('Located multiple Escort Profiles for the current User.  UserID : ' + this.getUserID() + ', Number of profiles : ' + escorts.length));
              } else {
                return escorts[0];
              }
            })
          );
        };

        return await this.getCacheableData(escortOnlineRequest, offlineRequest, keyIndexer, 'profile');

      case 'client':
        let clientOnlineRequest : ()=>Observable<any> = ()=>{
          let companyUsersFilter : string = JSON.stringify({where:{userID:this.getUserID()}});
          return this.companyUserService.companyUsersGet(companyUsersFilter).pipe(
            map<CompanyUser[]|undefined|null, CompanyUser>((companyUsers:CompanyUser[]|undefined|null) => {
              if (companyUsers == null || companyUsers == undefined || companyUsers.length == 0) {
                throwError(new Error('Failed to locate the Client Profile for the current User.  UserID : ' + this.getUserID()));
              } else if (companyUsers.length > 1) {
                throwError(new Error('Located multiple Client Profiles for the current User.  UserID : ' + this.getUserID() + ', Number of profiles : ' + companyUsers.length));
              } else {
                return companyUsers[0];
                /*
                let companiesFilter : string = JSON.stringify({where:{companyID:companyUsers[0].companyID}});
                return this.companyService.companiesGet(companiesFilter).pipe(
                  mergeMap<Company[]|undefined|null, Company>((companies:Company[]|undefined|null) => {
                    if (companies == null || companies == undefined || companies.length == 0) {
                      throwError(new Error('Failed to locate the Client Profile for the current Company.  CompanyID : ' + companyUsers[0].companyID));
                    } else if (companies.length > 1) {
                      throwError(new Error('Located multiple Client Profiles for the current Company.  CompanyID : ' + companyUsers[0].companyID + ', Number of profiles : ' + companies.length));
                    } else {
                      return of(companies[0]);
                    }
                  })
                );
                */
              }
            })
          );
        }

        return await this.getCacheableData(clientOnlineRequest, offlineRequest, keyIndexer, 'profile');

      case 'admin':
      default:
        throwError(new Error('Only ESCORT and CLIENT roles can edit their profiles. Current Role : ' + this.getRole()));
        break;
    }
  }

  saveProfile(profile : any) : Observable<boolean> {
    switch (this.getRole()) {
      case 'escort': 
        // Update the Escort Profile by the escortID
        return this.escortService.escortsEscortIDPatch(profile.escortID, profile).pipe(
          map((savedEscort:Escort) => {
            // Normal response from the server, indicate that the escort was saved (did not come back empty)
            return (savedEscort != null && savedEscort != undefined);
          }),
          catchError((err) => {
            // Error response from the server, indicate that save failed (return false)
            console.log(err);
            return of(false);
          })
        )
      case 'client':
        // Update the Company Profile by the companyID
        return this.companyService.companiesIdPatch(profile.company.companyID, profile.company).pipe(
          map((savedCompany:Company) => {
            // Normal response from the server, indicate that the company was saved (did not come back empty)
            return (savedCompany != null && savedCompany != undefined);
          }),
          catchError((err) => {
            // Error response from the server, indicate that save failed (return false)
            console.log(err);
            return of(false);
          })
        )
      case 'admin':
      default:
        throwError(new Error('Only ESCORT and CLIENT roles can edit their profiles. Current Role : ' + this.getRole()));
        break;
    }
  }


  searchForEscorts(searchCriteria : any) : Observable<Escort[]> {
    let filter : Filter = {};
    let criteria : any[] = [];

    /*
      public searchCriteria : any = {
        escortCerts : '',
        passportCountry : '',
        language1 : '',
        language2 : '',
        homeAirportCity : '',
        startDate : '',
        endDate : ''
      };
    */

    if ( searchCriteria.escortCerts !== undefined && searchCriteria.escortCerts.length > 0) { 
      if (searchCriteria.escortCerts.length == 1) {
        criteria.push( { licenseType: searchCriteria.escortCerts[0] } );
      } else {
        let certCriteria : any[] = searchCriteria.escortCerts.map( (v,i,l)=>{ return { licenseType: v } });
        criteria.push( { or: certCriteria } );
      }
    }

    if ( searchCriteria.passportCountry !== undefined && searchCriteria.passportCountry.trim().length > 0) { 
      criteria.push( { or: [ 
                            { passportCountry: searchCriteria.passportCountry },
                            { visaCountry1: searchCriteria.passportCountry },
                            { visaCountry2: searchCriteria.passportCountry },
                            { visaCountry3: searchCriteria.passportCountry }
                      ] } );
    }

    if ( searchCriteria.language1 !== undefined && searchCriteria.language1.trim().length > 0) { 
      criteria.push( { or: [ 
                            { language1: searchCriteria.language1 },
                            { language2: searchCriteria.language1 },
                            { language3: searchCriteria.language1 },
                            { language4: searchCriteria.language1 }
                      ] } );
    }

    if ( searchCriteria.language2 !== undefined && searchCriteria.language2.trim().length > 0) { 
      criteria.push( { or: [ 
                            { language1: searchCriteria.language2 },
                            { language2: searchCriteria.language2 },
                            { language3: searchCriteria.language2 },
                            { language4: searchCriteria.language2 }
                      ] } );
    }

    if ( searchCriteria.startDate != '' && searchCriteria.endDate != '' ) { 
      let numberOfDays : number = (( searchCriteria.endDate.valueOf() - searchCriteria.startDate.valueOf() ) / (1000 * 60 * 60 * 24)) + 1;
      
      if ( numberOfDays == 1 ) {
        criteria.push( { availability: { like: searchCriteria.startDate.toISOString() } } );
      } else {
        let dateCriteria : any[] = [];
        for (let i = 0; i < numberOfDays; i++) {
          let currentDate : Date = new Date(searchCriteria.startDate.valueOf() + ((1000 * 60 * 60 * 24) * i));
          dateCriteria.push( { availability: { like: currentDate.toISOString() } });
        }
        criteria.push( { and: dateCriteria } );
      }
    }

    if (criteria.length > 0) { filter.where = { and: criteria }; }

    return this.escortService.escortsGet(filter);
  }

  getAllEscorts() : Observable<Escort[]> {
    return this.escortService.escortsGet();
  }

  getAllClients() : Observable<CompanyUser[]> {
    return this.companyUserService.companyUsersGet();
  }

  deleteUsers(userIDs : string[]) : Observable<any> {
    let userIDsList : string = userIDs.join(',');
    return this.userService.usersDelete(userIDsList);
  }

  submitUserFeedback(message : string) : Observable<boolean> {
    let feedback : AppFeedback = {
      feedbackID : this.createUUID62(),
      userID : this.getUserID(),
      username : this.getName(),
      email : this.getEmail(),
      submittedDate : (new Date()).toISOString(),
      message : message
    };

    return this.userService.sendAppFeedback(feedback).pipe( 
      map((createdAppFeedback:AppFeedback)=>{ return true; }),
      catchError( (err)=>{ console.log('Failed to submit a users AppFeedback'); return of(false); })
    );
  }

}
