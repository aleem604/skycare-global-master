import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
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
  RestBindings,
} from '@loopback/rest';
import { inject } from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';

import * as request from "request-promise-native";
import { Escort, User, EscortLocation, CompanyCase, GPSPoint } from '../models';
import { EscortRepository, UserRepository, CompanyCaseRepository } from '../repositories';
import { decode } from 'jwt-simple';
import { Condition } from 'loopback-datasource-juggler';
import { Config } from '../config';
import * as cloudant from '@cloudant/cloudant';
import { Configuration, ServerScope, DocumentScope, Query } from '@cloudant/cloudant';

// @ts-ignore
import * as config from '../datasources/cloudant.datasource.json';
import { Response } from 'express-serve-static-core';


export class EscortsController {

  constructor(
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
    @inject('datasources.config.cloudant', {optional: true})  private dsConfig: Configuration = config,
    @repository(EscortRepository) public escortRepository : EscortRepository,
    @repository(UserRepository) public userRepository : UserRepository,
    @repository(CompanyCaseRepository) public companyCaseRepository : CompanyCaseRepository
  ) {}

  @get('/escorts', {
    responses: {
      '200': {
        description: 'Array of Escort model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Escort}},
          },
        },
      },
    },
  })
  @authenticate('JWTStrategy')
  async find(
    @param.query.object('filter', getFilterSchemaFor(Escort)) filter?: Filter,
  ): Promise<Escort[]> {

    let escorts : Escort[] = await this.escortRepository.find(filter);
    if (escorts.length == 0) { return escorts; }

    let userCriteria : any[] = escorts.map( (v,i,l) => { return { userID: v.userID } });
    let userFilter : Filter = { where: { or: userCriteria } };
    let users : User[] = await this.userRepository.find(userFilter);

    for (let ix = 0; ix < escorts.length; ix++) {
      let userIndex : number = users.findIndex( (v,i,l)=>{ return v.userID == escorts[ix].userID; });
      if (userIndex > -1) {
        escorts[ix].user = users[userIndex];
        //@ts-ignore
        escorts[ix].user.password = '';
        //@ts-ignore
        escorts[ix].user.key2FA = '';
      }
    }

    return escorts;
  }

  @patch('/escorts/{escortID}', {
    responses: {
      '204': {
        description: 'Escort PATCH success',
      },
    },
  })
  @authenticate('JWTStrategy')
  async updateById(
    @param.path.string('escortID') escortID: string,
    @requestBody() escort: Escort,
  ): Promise<boolean> {
    // Update the Escort Profile by its ID
    await this.escortRepository.updateById(escortID, escort);

    // Get the User record from the database for the current User
    let currentUser : User = await this.userRepository.findById(this.user.id);

    // Update the User record with the same name that was provided as part of the Escort Profile
    currentUser.name = escort.name;

    // Update the User record in the database
    await this.userRepository.updateById(currentUser.userID, currentUser);

    return true;
  }


  @post('/escorts/{escortID}/tracking', {
    responses: {
      '200': {
        description: 'Success / Failure indication',
        content: {'application/json': {schema: {type: 'boolean'}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async addEscortTrackingLocation(
    @param.header.string('Authorization') credentials : string,
    @param.path.string('escortID') escortID: string,
    @requestBody() escortLocation: EscortLocation,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<boolean> {

    response.setTimeout(600 * 1000);

    try {
      // Decode the JWT so we know the current user role
      let jwt : string = credentials.substr(credentials.indexOf(' ') + 1);
      let token : any = decode(jwt, Config.jwt.encryptingKey, false, Config.jwt.algorithm);

      // Connect to the Cloudant manually
      let cloudantConnection : ServerScope = cloudant(this.dsConfig);

      // Query the 'skycare' database, viewing the 'cases' design document for those that are 'activelyTrackingEscorts'
      let queryResponse : any = await cloudantConnection.use('skycare').view('cases', 'activelyTrackingEscorts');

      if (queryResponse.total_rows > 0) {
        // Extract the current Escort from the response      
        let escorts : Escort[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { return v.key.includes('ESCORT'); })
                                                  .map( (vx:any,ix:number,lx:any[]) => { let escort : Escort = vx.value as Escort; escort.escortID = vx.value._id; return escort; })
                                                  .filter( (vxx:any,ixx:number,lxx:any[]) => { return (vxx.userID == token.sub); });
                                                  
        // Exit now if there are no Escorts for the current User
        if (escorts.length == 0) { 
          console.log('ERROR: The current Escort was not located in the active Cases needing Escort tracking');
          return true; 
        }

        // Exit now if the first Escort does not match the provided escortID (Escort can only track their own location)
        let currentEscort : Escort = escorts[0];
        if (currentEscort.escortID != escortID) { 
          console.log('ERROR: How did this happen?  Filtered user Escort does not match the Escort being tracked.');
          console.log('ERROR METADATA: ' + escorts.length + ' - ' + escortID + ' - ' + currentEscort.escortID);
          return true; 
        }

        // Extract the CompanyCases from the response
        let companyCases : CompanyCase[] = queryResponse.rows.filter( (v:any,i:number,l:any[]) => { return v.key.includes('CASE'); })
                                                            .map( (vx:any,ix:number,lx:any[]) => { return vx.value as CompanyCase; })
                                                            .filter( (vxx:any,ixx:number,lxx:any[]) => { return vxx.escorts.some( (vxxx:any,ixxx:number,lxxx:any[])=>{ return vxxx.escortID==escortID; }) });

        // Exit now if there are no Cases for the current Escort that need to be actively tracked
        if (companyCases.length == 0) { 
          console.log('WARN: No currently active Cases, so no escort tracking needed');
          return true; 
        }

        // Record the Escort tracking info in each of the Cases that were located
        for (let i=0; i<companyCases.length; i++) {
          let stage : string = this.determineTrackingStage(companyCases[i]);
          console.log('INFO: CaseID - ' + companyCases[i].caseID + ' - Stage - ' + stage + ' - EscortLocationStage - ' + escortLocation.stage);
          if (stage == '') { continue; } // Case is in a non-tracking stage
          if (stage == 'flight' && escortLocation.stage == '') { continue; } // Escort is still on the ground, should be in the air

          if ((stage == 'preflight' || stage == 'postflight') && (companyCases[i].escortTracking !== undefined &&
                                                                  companyCases[i].escortTracking !== null && 
                                                                  companyCases[i].escortTracking.length > 0)) {
            // Get the last recorded location for the current stage
            let sortedLocationsForStage : EscortLocation[] = companyCases[i].escortTracking.filter( (vx,ix,lx)=>{ return vx.stage == stage; })
                                                                                            .sort( (a:EscortLocation,b:EscortLocation)=>{
                                                                                              let aDate : number = Date.parse(a.date);
                                                                                              let bDate : number = Date.parse(b.date);
                                                                                              
                                                                                              if ( aDate < bDate ) {
                                                                                                return -1;
                                                                                              } else if ( aDate > bDate ) {
                                                                                                return 1;
                                                                                              } else {
                                                                                                return 0;
                                                                                              }
                                                                                            });
            
            console.log('INFO: Number of existing tracked locations - ' + sortedLocationsForStage.length);

            if (sortedLocationsForStage.length > 0) {
              let lastLocation : EscortLocation = sortedLocationsForStage[sortedLocationsForStage.length-1];
              let lastLocationGPS : GPSPoint = { latitude: lastLocation.latitude, longitude: lastLocation.longitude } as GPSPoint;
              let currentLocationGPS : GPSPoint = { latitude: escortLocation.latitude, longitude: escortLocation.longitude } as GPSPoint;

              let distanceTravelled : number = this.calculateGPSDistance(lastLocationGPS, currentLocationGPS);
              if (distanceTravelled < 0.5) { 
                console.log('INFO: Current Escort location is not 0.5km or greater from last location - ' + distanceTravelled);
                continue; 
              } // Escort is on the ground, but they are not 0.5km from their last location
            }            
          }          

          escortLocation.stage = stage;
          if (companyCases[i].escortTracking === undefined || companyCases[i].escortTracking === null) { companyCases[i].escortTracking = []; }
          companyCases[i].escortTracking.push(escortLocation);
          
          // Update the database
          console.log('INFO: Attempting to update the Case - ' + companyCases[i].caseID);
          this.companyCaseRepository.updateById(companyCases[i].caseID, companyCases[i]).then( ()=>{
            console.log('INFO: Updated the case in the database');
          }).catch( (err)=>{
            console.log('ERROR: Failed while attempting to update a case in the database');
            console.log(err);
          }); 
        }
      } else {
        console.log('WARN: The current Escort does not have any active Cases needed tracking');
      }
        
      return true;
    } catch (err) {
      console.log('ERROR: Failed to track an escorts location');
      console.log(err);
      return false;
    }
  }


  @get('/flight/{flightNumber}/tracking', {
    responses: {
      '200': {
        description: 'Current coordinates for a flight',
        content: {'application/json': {schema: {'x-ts-type': GPSPoint}}},
      },
    },
  })
  @authenticate('JWTStrategy')
  async getFlightTrackingCoordinates(@param.path.string('flightNumber') flightNumber: string): Promise<GPSPoint> {
    
    const FLIGHT_AWARE_URL : string = 'http://'+Config.flightaware.user+':'+Config.flightaware.key+'@flightxml.flightaware.com/json/FlightXML2/GetLastTrack';
    const QUERY_STRING : string = '?ident='+flightNumber;

    let options = { uri: FLIGHT_AWARE_URL + QUERY_STRING };

    try {
      const rawResult : string = await request.get(options);
      const result : any = JSON.parse(rawResult);

      if (result.error !== undefined && result.error !== null) { 
        console.log('ERROR: Failed to retrieve a flight location');
        console.log(result.error);
        return { latitude: 0, longitude: 0 } as GPSPoint; 
      } else if (result.GetLastTrackResult === undefined || result.GetLastTrackResult.data === undefined || result.GetLastTrackResult.data.length == 0) {
        console.log('No flight data was returned');
        return { latitude: 0, longitude: 0 } as GPSPoint; 
      } else {
        let mostRecentTrackingLocation : any = result.GetLastTrackResult.data[result.GetLastTrackResult.data.length-1];
        return {
            latitude: parseFloat(mostRecentTrackingLocation.latitude),
            longitude: parseFloat(mostRecentTrackingLocation.longitude)
        } as GPSPoint;
      }
    } catch (err) {
      console.log('ERROR: Failed to retrieve a flight location');
      console.log(err);
      return { latitude: 0, longitude: 0 } as GPSPoint;
    }
  }


  determineTrackingStage(currentCase : CompanyCase) : string {
    switch (currentCase.currentStatus) {
      case 'Escort picked up patient on way to airport':
      case 'Airport check-in complete and awaiting departure':
        return 'preflight';
      case 'Boarded & departed origin city':
      case 'Arrived & waiting in connection airport 1':
      case 'Boarded & departed connection airport 1':
      case 'Arrived & waiting in connection airport 2':
      case 'Boarded & departed connection airport 2':
        return 'flight';
      case 'Escort & patient arrived destination city':
      case 'Escort & patient with ground transport to final destination':
        return 'postflight';
      default:
        return '';
    }
  }


  degreesToRadians(degrees : number) : number { return degrees * Math.PI / 180; }
      
  calculateGPSDistance(origin : GPSPoint, dest : GPSPoint) : number {
      const EARTH_RADIUS_KM : number = 6371;
    
      let latDiffRadians : number = this.degreesToRadians(dest.latitude - origin.latitude);
      let lonDiffRadians : number = this.degreesToRadians(dest.longitude - origin.longitude);
    
      let originLatitudeAsRadians : number = this.degreesToRadians(origin.latitude);
      let destLatitudeAsRadians : number = this.degreesToRadians(dest.latitude);
    
      var a = Math.sin(latDiffRadians/2) * Math.sin(latDiffRadians/2) +
              Math.sin(lonDiffRadians/2) * Math.sin(lonDiffRadians/2) * 
              Math.cos(originLatitudeAsRadians) * Math.cos(destLatitudeAsRadians); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return Math.floor(EARTH_RADIUS_KM * c);      
  }

}
