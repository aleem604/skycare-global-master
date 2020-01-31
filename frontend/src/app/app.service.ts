import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

import { BaseService } from './base.service';
import { first } from 'rxjs/operators';
import { interval, concat, Observable } from 'rxjs';
import { NetworkMonitoringService } from './netmon.service';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AppService extends BaseService {


  constructor(private updates: SwUpdate,
              private appRef: ApplicationRef,
              public readonly netmonService : NetworkMonitoringService) { 
    super(netmonService, '');

    // Check for updates once every 6 hours
    const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);
    everySixHoursOnceAppIsStable$.subscribe(() => updates.checkForUpdate());

    updates.available.subscribe(availableEvent => {
      console.log('current version is ' + availableEvent.current);
      console.log('available version is ' + availableEvent.available);
      location.reload(true);
    });

    updates.activated.subscribe(actviatedEvent => {
      console.log('old version was ' + actviatedEvent.previous);
      console.log('new version is ' + actviatedEvent.current);
    });

  }


}
