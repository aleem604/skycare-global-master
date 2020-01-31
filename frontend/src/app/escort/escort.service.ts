import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { EscortLocation, EscortsControllerService } from '../apiClient';
import { AuthService } from '../auth/auth.service';
import { NetworkMonitoringService } from '../netmon.service';

@Injectable({
  providedIn: 'root'
})
export class EscortService extends BaseService {

  public trackingLocation : boolean = false;
  public locationTrackingTimer : any = null;
  public currentLocation : Coordinates;

  constructor(private authService : AuthService,
              private escortService : EscortsControllerService,
              public readonly netmonService : NetworkMonitoringService) { 
    super(netmonService, ''); 
  }


  startTrackingEscortLocation() : void {
    if (this.getRole() == 'escort' && !this.trackingLocation) {
      this.locationTrackingTimer = setTimeout( ()=>{
        this.trackingLocation = true;
        this.getCurrentLocation();
        this.locationTrackingTimer = setInterval( ()=>{ this.getCurrentLocation(); }, 10*60*1000);
      }, 5000);
    }
  }

  stopTrackingEscortLocation() : void {
    if (this.trackingLocation) {
      clearInterval(this.locationTrackingTimer);
      this.trackingLocation = false;
    }
  }

  getCurrentLocation() : void {
    navigator.geolocation.getCurrentPosition( (position)=>{
      this.currentLocation = position.coords;
    
      console.log('Your current position is:');
      console.log(`Latitude : ${this.currentLocation.latitude}`);
      console.log(`Longitude: ${this.currentLocation.longitude}`);
      console.log(`More or less ${this.currentLocation.accuracy} meters.`);

      this.trackLocation(this.currentLocation.latitude, this.currentLocation.longitude);
    }, 
    (error) => {
      console.warn(`ERROR(${error.code}): ${error.message}`);
    }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
  }

  trackLocation(latitude : number, longitude : number, inFlight : boolean = false) : void {
    let newEscortLocation : EscortLocation = {
      escortID: this.authService.currentProfile.escortID,
      date: (new Date()).toISOString(),
      latitude: latitude,
      longitude: longitude,
      stage: ''
    }
    if (inFlight) { newEscortLocation.stage = 'flight'; }

    // Track the escort current location
    this.escortService.addEscortTrackingLocation(this.authService.currentProfile.escortID, newEscortLocation).subscribe( (success:boolean) => {
      console.log('completed tracking the escort');
    }, (err)=>{
      console.log('error tracking the escort');
    });
  }

}
