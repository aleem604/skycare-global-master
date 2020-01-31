import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { CompanyCase, EscortLocation } from '../../apiClient';

import { LatLngLiteral } from '@agm/core';
import { DataService, GPSPoint } from '../../controls/data.service';
import { CaseService } from '../case.service';
import { Clusterize, Group } from '../../controls/kmeans';


@Component({
  selector: 'app-map-tracking',
  templateUrl: './map-tracking.component.html',
  styleUrls: ['./map-tracking.component.scss']
})
export class MapTrackingComponent implements OnInit {

  public lat: Number = 24.799448;
  public lng: Number = 120.979021;

  public sortedGroundLocations : LatLngLiteral[];
  public lastGroundLocation : LatLngLiteral = { lat: 0, lng: 0 };
  public lastFlightLocation : LatLngLiteral = { lat: 0, lng: 0 };

  public startMarkerIcon : string = 'assets/images/start-marker_small.png';
  public endMarkerIcon : string = 'assets/images/end-marker_small.png';
  public flightMarkerIcon : string = 'assets/images/airport-marker_small.png';

  public trackedMarkerOptions = {
    origin:       { icon: this.startMarkerIcon },
    destination:  { opacity: 0.0 },
    waypoints:    { opacity: 0.0 }
  }
  public trackedRenderOptions = {
    markerOptions: { clickable : false },
    polylineOptions: { strokeColor: "green" },
    suppressMarkers: true
  }

  public remainingMarkerOptions = {
    origin:       { opacity: 0.0 },
    destination:  { icon: this.flightMarkerIcon }
  }





  public kmeansOptions : any = { k: 23 };
  
  public trackedOriginBeforeFlight: LatLngLiteral;
  public trackedWaypointsBeforeFlight: any[] = [];
  public trackedDestinationBeforeFlight: LatLngLiteral;
  public sortedLocationsBeforeFlight : LatLngLiteral[];

  public remainingGroundTravel : boolean = false;
  public remainingGroundTravelOrigin : LatLngLiteral;
  public remainingGroundTravelDestination : LatLngLiteral;

  public trackedFlights : boolean = false;
  public trackedFlightStops : LatLngLiteral[];

  public remainingFlights : boolean = false;
  public remainingFlightStops : LatLngLiteral[];

  public trackedGroundTravelAfterFlight : boolean = false;
  public trackedOriginAfterFlight: LatLngLiteral;
  public trackedWaypointsAfterFlight: any[] = [];
  public trackedDestinationAfterFlight: LatLngLiteral;
  public sortedLocationsAfterFlight : LatLngLiteral[];

  public currentCase : CompanyCase;

  constructor(private modalController: ModalController,
              private navParams: NavParams,
              private dataService: DataService,
              private caseService: CaseService) { }


  ngOnInit() {
  }

  async ionViewWillEnter() : Promise<void> {
    let caseID : string | undefined = this.navParams.get('caseID');
    let companyID : string | undefined = this.navParams.get('companyID');
    if ( caseID !== undefined && caseID != null && caseID.trim().length > 0 &&
         companyID !== undefined && companyID != null && companyID.trim().length > 0 ) {
      
      (await this.caseService.getCase(companyID,caseID)).subscribe(
        async (retrievedCases:any[]) => {
          if (retrievedCases.length == 0) { return; }

          this.currentCase = (retrievedCases[0]) as CompanyCase;
          switch (this.currentCase.currentStatus) {
            case 'Boarded & departed origin city':
            case 'Boarded & departed connection airport 1':
            case 'Boarded & departed connection airport 2':
              await this.loadCurrentFlightLocation();
              break;
            default:
              await this.loadCurrentGroundLocation();
              break;
          }
      });
    }
  }


  async loadCurrentGroundLocation() : Promise<void> {
    this.sortedGroundLocations= this.currentCase.escortTracking
      .filter( (v,i,l)=>{ return v.stage=='preflight' || v.stage=='postflight'; })
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
      }).map( (v,i,l) => {
        return {
          lat: parseFloat(v.latitude.toString()),
          lng: parseFloat(v.longitude.toString())
        } as LatLngLiteral;
    });

    this.lastGroundLocation = this.sortedGroundLocations[this.sortedGroundLocations.length-1];
    this.lat = this.lastGroundLocation.lat;
    this.lng = this.lastGroundLocation.lng;
  }

  async loadCurrentFlightLocation() : Promise<void> {
    let currentFlight : GPSPoint = null;
    if (this.currentCase.currentStatus == 'Boarded & departed origin city' && this.currentCase.flightNumber1 !== undefined && this.currentCase.flightNumber1.trim().length > 0) {
      currentFlight = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber1);
    } else if (this.currentCase.currentStatus == 'Boarded & departed connection airport 1' && this.currentCase.flightNumber2 !== undefined && this.currentCase.flightNumber2.trim().length > 0) {
      currentFlight = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber2);
    } else if (this.currentCase.currentStatus == 'Boarded & departed connection airport 2' && this.currentCase.flightNumber3 !== undefined && this.currentCase.flightNumber3.trim().length > 0) {
      currentFlight = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber3);
    }
    if (currentFlight !== null && currentFlight.latitude != 0) { 
      this.lastFlightLocation = this.convertToLatLngLiteral(currentFlight); 
      this.lat = this.lastFlightLocation.lat;
      this.lng = this.lastFlightLocation.lng;
    } else {
      await this.loadCurrentGroundLocation();
    }
  }

  async loadLocationData() : Promise<void> {
    if (this.currentCase.escortTracking === undefined || this.currentCase.escortTracking === null || this.currentCase.escortTracking.length == 0) {
      this.currentCase.escortTracking = [];
      await this.close();
      return;
    }

    this.sortedLocationsBeforeFlight = this.currentCase.escortTracking
      .filter( (v,i,l)=>{ return v.stage=='preflight'; })
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
      }).map( (v,i,l) => {
        return {
          lat: parseFloat(v.latitude.toString()),
          lng: parseFloat(v.longitude.toString())
        } as LatLngLiteral;
    });
    
    this.trackedOriginBeforeFlight = this.sortedLocationsBeforeFlight[0];
    this.trackedDestinationBeforeFlight = this.sortedLocationsBeforeFlight[this.sortedLocationsBeforeFlight.length-1];

    if (this.sortedLocationsBeforeFlight.length > 2) { 
      this.trackedWaypointsBeforeFlight = this.sortedLocationsBeforeFlight.slice(1, this.sortedLocationsBeforeFlight.length-1).map( (v,i,l)=>{
        return {
          location: v,
          stopover: true
        };
      });

      if (this.trackedWaypointsBeforeFlight.length > 23) {
        let vectors : any[] = this.trackedWaypointsBeforeFlight.map( (vx,ix,lx)=>{ return [ vx.location.lat, vx.location.lng ]; });
        new Clusterize(vectors, this.kmeansOptions, (err:Error,output:any[])=>{
          if (err !== undefined && err !== null) {
            this.trackedWaypointsBeforeFlight = this.trackedWaypointsBeforeFlight.slice(0, 23);
          } else {
            this.trackedWaypointsBeforeFlight = output.filter( (vx,ix,lx)=>{ return vx.centroid.length == 2; })
                                                      .map( (vx,ix,lx)=>{ return { 
                                                                            location: { 
                                                                              lat: vx.centroid[0], 
                                                                              lng: vx.centroid[1] }, 
                                                                            stopover: true };
            });
          }
        });
      }
    }


    await this.determineRemainingGroundTravel();


    this.trackedFlightStops = this.currentCase.escortTracking
      .filter( (v,i,l)=>{ return v.stage=='flight'; })
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
      }).map( (v,i,l) => {
        return {
          lat: parseFloat(v.latitude.toString()),
          lng: parseFloat(v.longitude.toString())
        } as LatLngLiteral;
    });
    if (this.currentCase.currentStatus == 'Boarded & departed origin city' && this.currentCase.flightNumber1 !== undefined && this.currentCase.flightNumber1.trim().length > 0) {
      let currentFlight : GPSPoint = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber1);
      if (currentFlight.latitude != 0) { this.trackedFlightStops.push( this.convertToLatLngLiteral(currentFlight) ); }
    }
    if (this.currentCase.currentStatus == 'Boarded & departed connection airport 1' && this.currentCase.flightNumber2 !== undefined && this.currentCase.flightNumber2.trim().length > 0) {
      let currentFlight : GPSPoint = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber2);
      if (currentFlight.latitude != 0) { this.trackedFlightStops.push( this.convertToLatLngLiteral(currentFlight) ); }
    }
    if (this.currentCase.currentStatus == 'Boarded & departed connection airport 2' && this.currentCase.flightNumber3 !== undefined && this.currentCase.flightNumber3.trim().length > 0) {
      let currentFlight : GPSPoint = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber3);
      if (currentFlight.latitude != 0) { this.trackedFlightStops.push( this.convertToLatLngLiteral(currentFlight) ); }
    }
    this.trackedFlights = (this.trackedFlightStops.length > 0);


    await this.determineRemainingFlightTravel();

    
    this.sortedLocationsAfterFlight = this.currentCase.escortTracking
      .filter( (v,i,l)=>{ return v.stage=='postflight'; })
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
      }).map( (v,i,l) => {
        return {
          lat: parseFloat(v.latitude.toString()),
          lng: parseFloat(v.longitude.toString())
        } as LatLngLiteral;
    });
    this.trackedGroundTravelAfterFlight = (this.sortedLocationsAfterFlight.length > 0);
    
    this.trackedOriginAfterFlight = this.sortedLocationsAfterFlight[0];
    this.trackedDestinationAfterFlight = this.sortedLocationsAfterFlight[this.sortedLocationsAfterFlight.length-1];

    if (this.sortedLocationsAfterFlight.length > 2) { 
      this.trackedWaypointsAfterFlight = this.sortedLocationsAfterFlight.slice(1, this.sortedLocationsAfterFlight.length-1).map( (v,i,l)=>{
        return {
          location: v,
          stopover: true
        };
      });

      if (this.trackedWaypointsAfterFlight.length > 23) {
        let vectors : any[] = this.trackedWaypointsAfterFlight.map( (vx,ix,lx)=>{ return [ vx.location.lat, vx.location.lng ]; });
        new Clusterize(vectors, this.kmeansOptions, (err:Error,output:any[])=>{
          if (err !== undefined && err !== null) {
            this.trackedWaypointsAfterFlight = this.trackedWaypointsAfterFlight.slice(0, 23);
          } else {
            this.trackedWaypointsAfterFlight = output.filter( (vx,ix,lx)=>{ return vx.centroid.length == 2; })
                                                      .map( (vx,ix,lx)=>{ return { 
                                                                            location: { 
                                                                              lat: vx.centroid[0], 
                                                                              lng: vx.centroid[1] }, 
                                                                            stopover: true };
            });
          }
        });
      }
    }
  }
 

  async determineRemainingGroundTravel() : Promise<void> {
    this.remainingGroundTravel = (this.currentCase.currentStatus == 'Escort picked up patient on way to airport' || 
                                  this.currentCase.currentStatus == 'Airport check-in complete and awaiting departure');
    
    if (this.remainingGroundTravel) {
      let originAirport : GPSPoint = await this.dataService.getGPSCoordinatesForAirport(this.currentCase.originCity);
      this.remainingGroundTravelOrigin = this.sortedLocationsBeforeFlight[this.sortedLocationsBeforeFlight.length-1];
      this.remainingGroundTravelDestination = this.convertToLatLngLiteral(originAirport);
    }
  }


  async determineRemainingFlightTravel() : Promise<void> {
    this.remainingFlights = (this.remainingGroundTravel ||
                             this.currentCase.currentStatus == 'Boarded & departed origin city' || 
                             this.currentCase.currentStatus == 'Arrived & waiting in connection airport 1' || 
                             this.currentCase.currentStatus == 'Boarded & departed connection airport 1' || 
                             this.currentCase.currentStatus == 'Arrived & waiting in connection airport 2' || 
                             this.currentCase.currentStatus == 'Boarded & departed connection airport 2');
    
    if (this.remainingFlights) {
      let nextStop : GPSPoint = await this.dataService.getGPSCoordinatesForAirport(this.currentCase.destinationCity);
      this.remainingFlightStops = [ this.convertToLatLngLiteral(nextStop) ];

      if (this.currentCase.connectionCity2) {
        if (this.currentCase.currentStatus == 'Boarded & departed connection airport 2' && this.currentCase.flightNumber3 !== undefined && this.currentCase.flightNumber3.trim().length > 0) {
          nextStop = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber3);
          if (nextStop.latitude != 0) {
            this.remainingFlightStops.unshift( this.convertToLatLngLiteral(nextStop) );
            return;
          }
        }

        nextStop = await this.dataService.getGPSCoordinatesForAirport(this.currentCase.connectionCity2);
        this.remainingFlightStops.unshift( this.convertToLatLngLiteral(nextStop) );
      }

      if (this.currentCase.connectionCity1 && this.currentCase.currentStatus != 'Arrived & waiting in connection airport 2' && 
                                              this.currentCase.currentStatus != 'Boarded & departed connection airport 2') {
        if (this.currentCase.currentStatus == 'Boarded & departed connection airport 1' && this.currentCase.flightNumber2 !== undefined && this.currentCase.flightNumber2.trim().length > 0) {
          nextStop = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber2);
          if (nextStop.latitude != 0) {
            this.remainingFlightStops.unshift( this.convertToLatLngLiteral(nextStop) );
            return;
          }
        }
        
        nextStop = await this.dataService.getGPSCoordinatesForAirport(this.currentCase.connectionCity1);
        this.remainingFlightStops.unshift( this.convertToLatLngLiteral(nextStop) );
      }

      if (this.currentCase.currentStatus == 'Boarded & departed origin city' && this.currentCase.flightNumber1 !== undefined && this.currentCase.flightNumber1.trim().length > 0) {
        nextStop = await this.dataService.acquireCurrentFlightLocation(this.currentCase.flightNumber1);
        if (nextStop.latitude != 0) {
          this.remainingFlightStops.unshift( this.convertToLatLngLiteral(nextStop) );
        }
      }
      
      if (this.remainingGroundTravel || ((this.currentCase.currentStatus == 'Boarded & departed origin city' && (this.currentCase.flightNumber1 === undefined || this.currentCase.flightNumber1.trim().length == 0)) || nextStop.latitude == 0)) {
        nextStop = await this.dataService.getGPSCoordinatesForAirport(this.currentCase.originCity);
        this.remainingFlightStops.unshift( this.convertToLatLngLiteral(nextStop) );
      }
    } else {
      this.remainingFlightStops = [];
    }
  }


  async close() { await this.modalController.dismiss(); }

  convertToLatLngLiteral(gpsPoint : GPSPoint) : LatLngLiteral { return { lat: gpsPoint.latitude, lng: gpsPoint.longitude } as LatLngLiteral; }


}
