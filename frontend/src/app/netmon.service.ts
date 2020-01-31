import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { ToastController } from '@ionic/angular';
import { environment } from '../environments/environment';


declare const window : any;


@Injectable({ providedIn: 'root' })
export class NetworkMonitoringService {

  private internalConnectionStatus : boolean = false;
  private internalConnectionChanged = new Subject<boolean>();
  private pingTimer : any = null;

  get connectionChanged() {
    return this.internalConnectionChanged.asObservable();
  }

  get isOnline() {
    //return !!window.navigator.onLine;
    return this.internalConnectionStatus;
  }

  constructor(private toaster : ToastController) {
    if (this.pingTimer === null || this.pingTimer === undefined) {
      this.pingTimer = window.setInterval( this.pingServer.bind(this), 15000);
      this.pingServer().then(success=>{return;});
    }
  }

  async pingServer() : Promise<void> {
    let fetchSucceeded : boolean = false;
    try{
      let response : Response = await this.fetchWithTimeout(environment.pingURL+'?_='+(new Date()).valueOf().toString());
      fetchSucceeded = true;
    } catch (e) {
      fetchSucceeded = false;
    }

    if (this.internalConnectionStatus != fetchSucceeded) {
      console.log('NETMON: manual checker says we are ' + ((fetchSucceeded)?'online':'offline'));
      this.updateOnlineStatus(fetchSucceeded);
    }
  }

  private updateOnlineStatus(onlineStatus : boolean = window.navigator.onLine) {
    this.internalConnectionStatus = onlineStatus;
    this.internalConnectionChanged.next(onlineStatus);
  }

  private fetchWithTimeout(url, timeout = 10000) : Promise<Response> {
    let controller : AbortController = new AbortController();
    let abortSignal : AbortSignal = controller.signal;
    let options : RequestInit = { signal: abortSignal };

    return Promise.race([
        new Promise<Response>(async (resolve,reject)=>{
          try {
            let response : Response = await fetch(url, options);
            controller.abort();

            // iOS does not correctly report a server disconnect...it will instead indicate 'Gateway Timeout'
            if (response.statusText.toLowerCase().indexOf('timeout') > -1) {
              throw new Error('iOS disconnected from server');
            }

            console.log('PING Response: ' + response.statusText);
            if (this.internalConnectionStatus !== true) {
              this.updateOnlineStatus(true);
            }
            resolve(response);
          }catch(e){
            if (e.message && e.message == 'iOS disconnected from server') {
              // NO-OP
            } else {
              console.log('FETCH ERROR: ' + JSON.stringify(e));
            }

            if (this.internalConnectionStatus === true) {
              this.updateOnlineStatus(false);
            }

            reject(e);
          }
        }),
        new Promise<Response>((_, reject) =>
            setTimeout(() => {
              if (abortSignal.aborted) { return; }
              
              console.log('FETCH TIMEOUT');
              controller.abort();
              if (this.internalConnectionStatus === true) {
                this.updateOnlineStatus(false);
              }

              reject(new Error('timeout'));
            }, timeout)
        )
    ]);
  }

}
