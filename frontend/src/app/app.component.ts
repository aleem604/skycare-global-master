import { Component, OnInit, ElementRef } from '@angular/core';

import { Platform, MenuController, ToastController, LoadingController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { EscortService } from './escort/escort.service';
import { AppService } from './app.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as fetchInterceptor from 'fetch-intercept';

import Dexie from 'dexie';
const db = new Dexie("skycare-sync");
db.version(1).stores({
    requests: '&id,url,method,payload,headers,timestamp'
});
db.open();

declare const window : any;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  private interceptorUnregister : any;

  public offlineBannerDisplayed : boolean = false;
  public offlineBanner : HTMLIonToastElement | undefined;
  public syncStarted : boolean = false;

  public currentlyLoggedIn: Observable<boolean>;
  public menuDisabled: boolean = true;
  public menuItems: any[] = [];

  public syncProgress : HTMLIonLoadingElement;
  public totalItemsToSync : number = 0;
  public currentSyncItemIndex : number = 0;
  public currentSyncItemName = '';
  public syncErrors : string[] = [];

  public channel : MessageChannel = new MessageChannel();

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private document: ElementRef,
    private authService: AuthService,
    private escortService: EscortService,
    private appService: AppService,
    private menuCtrl: MenuController,
    private loadingController : LoadingController,
    private route: ActivatedRoute,
    private router: Router,
    private toaster : ToastController,
    protected httpClient: HttpClient
  ) {
    this.initializeApp();

    this.currentlyLoggedIn = this.authService.getLoggedInObservable();

    this.currentlyLoggedIn.subscribe(
      (observer: any) => {
        this.menuDisabled = !this.authService.isAuthenticated() || this.authService.getRole() == 'limited';
        this.loadMenuItems();
      });

    this.displayNoticeWhenOffline();   
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  async ngOnInit() {
    if (this.platform.is('ios') && window.location.search.indexOf('reload') > -1) {
      setTimeout((()=>{ this.sendMessageToServiceWorker('reload'); }).bind(this), 1000);
      return;
    }

    this.registerFetchInterceptor();

    if (this.authService.isAuthenticated()) {
      this.initializeProfile();
    } else {
      this.authService.getLoggedInObservable().subscribe((loggedIn:boolean)=>{
        this.initializeProfile();
      })
    }
  }

  private async initializeProfile() : Promise<void> {
    (await this.authService.loadProfile()).subscribe( (profile: any) => {
      console.log('APP.COMPONENT - Initializing Profile');
      if (profile !== undefined && profile !== null && profile.user.role == 'escort') {
        this.escortService.startTrackingEscortLocation();
      }
    });
  }

  loadMenuItems(): void {
    if (this.authService.isAuthenticated()) {
      this.menuItems = [{
                          title: 'Flight Board',
                          url: '/dashboard/' + this.authService.getRole(),
                          icon: 'home',
                          disabled: false
                        }];
      
      if (this.authService.getRole() == 'admin') {
        this.menuItems.push({
          title: 'Invite User',
          url: '/auth/inviteUser',
          icon: 'person-add',
          disabled: false
        });     
        this.menuItems.push({
          title: 'Create Case',
          url: '/case/create',
          icon: 'paper',
          disabled: false
        });       
        this.menuItems.push({
          title: 'View All Users',
          url: '/auth/users',
          icon: 'people',
          disabled: false
        });       
        this.menuItems.push({
          title: 'Search for Escorts',
          url: '/escorts/search',
          icon: 'search',
          disabled: false
        });       
        this.menuItems.push({
          title: 'Pay Escorts',
          url: '/escorts/pay',
          icon: 'cash',
          disabled: false
        });  
        this.menuItems.push({
          title: 'Receivables',
          url: '/case/receivables',
          icon: 'trophy',
          disabled: false
        });      
        this.menuItems.push({
          title: 'Case Archives',
          url: '/case/archives',
          icon: 'filing',
          disabled: false
        });             

      } else {
        this.menuItems.push({
          title: 'Profile',
          url: '/auth/profile/' + this.authService.getRole(),
          icon: 'person',
          disabled: false
        });
      }
      
      this.menuItems.push({
        title: 'Logout',
        url: '/auth/logout',
        icon: 'log-out',
        disabled: false
      });

    } else {
      this.menuItems = [];
    }
  }


  displayNoticeWhenOffline() : void {
    this.appService.connectionChanged.subscribe(async (online:boolean) => {  
      if (online) {
        console.log('displayNotice says we are online');
        // Remove any offline notices
        if (this.offlineBanner !== undefined) { 
          await this.offlineBanner.dismiss(); 
          this.offlineBannerDisplayed = false;
        }

        // Enable profile editing
        let profileIndex : number = this.menuItems.findIndex( (v,i,l)=>{ return v.title.toLowerCase() == 'profile'; });
        if (profileIndex > -1) { this.menuItems[profileIndex].disabled = false; }

        console.log('displayNotice will try to start the sync : ' + this.syncStarted);
        // Sync anything that happened while we were offline
        if (this.syncStarted == false) {
          this.syncStarted = true;
          this.sendMessageToServiceWorker('start_sync');
        } else {
          console.log('Not staring the sync because it is already started');
        }
      } else {
        if (this.offlineBannerDisplayed == false) {
          // Present a notice to the user
          this.offlineBanner = await this.toaster.create({ 
            message: 'YOU ARE OFFLINE',
            color: 'danger',
            cssClass: 'offline',
            showCloseButton: false,
            keyboardClose: false,
            position: 'top'
          });
          await this.offlineBanner.present();
          this.offlineBannerDisplayed = true;
        }

        this.syncStarted = false;

        // Disable profile editing
        let profileIndex : number = this.menuItems.findIndex( (v,i,l)=>{ return v.title.toLowerCase() == 'profile'; });
        if (profileIndex > -1) { this.menuItems[profileIndex].disabled = true; }
      }
    });
  }


  sendMessageToServiceWorker(message : string) : void {
    console.log('APP INFO : Trying to send the ' + message + ' to the SW');
    if (navigator.serviceWorker.controller) {
      this.channel = new MessageChannel();
      this.channel.port1.onmessage = this.handleServiceWorkerReponseMessage.bind(this);
      //this.channel.port1.addEventListener('message', this.handleServiceWorkerReponseMessage.bind(this));

      // Send the message to the ServiceWorker
      navigator.serviceWorker.controller.postMessage(message, [this.channel.port2]);
    } else {
      setTimeout((()=>{ this.sendMessageToServiceWorker(message); }).bind(this), 1000);
    }
  }

  private serializeObject(obj:any){
    let returnValue : string = '';
    for(let i in obj){
      returnValue += '\n' + i + ' = ' + obj[i];
    }
    return returnValue;
  }


  private handleServiceWorkerReponseMessage(event : MessageEvent) : void {
    console.log('Caught a message: ' + JSON.stringify(event));
    if (event.data.type == 'sync_started') {
      console.log('APP COMPONENT: Sync is starting');
                      
      this.totalItemsToSync = event.data.totalItemsToSync;
      this.currentSyncItemIndex = 0;
      this.currentSyncItemName = event.data.description;
      this.syncErrors = [];

      console.log(this.totalItemsToSync);
      if (this.totalItemsToSync == 0) { 
        this.syncStarted = false;
        return; 
      }

      this.toaster.create({ 
        message: this.totalItemsToSync + ' : Sync is starting',
        color: 'primary',
        duration: 500,
        showCloseButton: false,
        keyboardClose: true,
        position: 'top'
      }).then((newToast)=>{ return newToast.present(); 
      }).then(()=>{ return; });
      
      this.loadingController.create({
        message: this.currentSyncItemName,
        spinner: 'crescent'
      }).then( async (newLoader : HTMLIonLoadingElement) => {
        this.syncProgress = newLoader;
        await this.syncProgress.present();
        this.sendMessageToServiceWorker('sync');
      });
    } else if (event.data.type == 'sync_request') {
      console.log('APP COMPONENT: Processing a sync request');

      let url : string = event.data.url;
      let requestInit = {
        method: event.data.method,
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
        body: event.data.payload
      };

      this.currentSyncItemIndex = event.data.currentSyncItemIndex;
      this.currentSyncItemName = event.data.description;
      this.syncProgress.message = '(' + this.currentSyncItemIndex + ' / ' + this.totalItemsToSync + ') ' + this.currentSyncItemName;

      fetch(url, requestInit).then((response)=>{
        if (response.ok) {
          console.log(`APP COMPONENT: Finished a ${event.data.method} sync request`);
          this.sendMessageToServiceWorker('sync_request_finished');
          return;
        }

        console.log(response);
        throw new Error('The response was not ok');
      }).catch((error)=>{ 
        console.log(error);
        console.log('Failed to retry a request that was queued during offline mode.');
      });
    } else if (event.data.type == 'sync_finished') {
      console.log('Sync is finished');
      this.syncStarted = false;
      this.syncProgress.dismiss().then( async (success) => {
        await this.toaster.create({ showCloseButton: true, duration: 0, message: 'Sync with server completed' })
      });
    }
  }


  private registerFetchInterceptor() : void {
    this.interceptorUnregister = fetchInterceptor.register({

        request: ((request, config) => {

            // We use a full Request object, so even though request is supposed to be a string, it will usually contain a Request
            if (typeof request == 'string') { 
                console.log('FETCH INTERCEPTOR - REQUEST - Basic');
                console.log(request);
                console.log(config);  
                if (config.headers !== undefined) { 
                  config.headers.set('Authorization', `Bearer ${this.authService.getJWT()}`);
                }
                this['lastRequest'] = request;  
                this['lastRequestConfig'] = config;    
                return [request, config];
            } else {
                console.log('FETCH INTERCEPTOR - REQUEST - Object');
                console.log(request);
                console.log(config);
                let newRequest : Request = (request as Request);
                const url : string = newRequest.url;
                if (url.indexOf('complete2FA') != -1 || url.indexOf('sendNew2FAPINCode') != -1) {
                    // 2FA login or 2FA resend - use the TEMP-JWT instead of the normal JWT
                    newRequest.headers.set('Authorization', `Bearer ${this.authService.getTempJWT()}`);
                } else if (url.indexOf('login') != -1 || url.indexOf('beginCredentialReset') != -1 || 
                            url.indexOf('finishCredentialReset') != -1 || url.indexOf('iatageo') != -1 ||
                            url.indexOf('exchangeratesapi') != -1 || url.indexOf('flightaware') != -1 ||
                            url.indexOf('publicCases') != -1) {
                    console.log('INFO: Non-JWT secured route requested');
                    // NOOP - these are not JWT secured routes
                } else {
                    // All other cases, use the normal JWT
                    newRequest.headers.set('Authorization', `Bearer ${this.authService.getJWT()}`);
                }    

                this['lastRequest'] = newRequest;  
                this['lastRequestConfig'] = config;
                return [newRequest, config];
            }
        }).bind(this),
    
        requestError: function (error) {
            console.log('FETCH INTERCEPTOR - REQUEST ERROR');
            console.log(error);
            // Called when an error occured during another 'request' interceptor call
            return Promise.reject(error);
        },
    
        response: ((response) => {
          let responseURL : string = response.url;
          if (responseURL.indexOf('ping') > -1 || responseURL.indexOf('tracking') > -1 || responseURL.indexOf('login') > -1) { return response; }

          console.log('FETCH INTERCEPTOR - RESPONSE');
          console.log(response);

          if (!response.ok) {
            console.log('FETCH INTERCEPTOR - Response was not ok');
            console.log(this['lastRequest']);      
            console.log('FETCH INTERCEPTOR - Get the config');   
            console.log(this['lastRequestConfig']);       
            let lastRequest : Request = new Request(responseURL, this['lastRequestConfig']);
            storeFailedRequest(lastRequest);
          }
          // Modify the reponse object
          return response;
        }).bind(this),
    
        responseError: ((error) => {          
          if (error.message.indexOf('NetworkError') > -1 || error.message.indexOf('Failed to fetch') > -1) {
            console.log('FETCH INTERCEPTOR - RESPONSE ERROR');
            console.log(error);
            let lastRequest : Request = this['lastRequest'].clone();
            storeFailedRequest(lastRequest);
          }
          // Handle an fetch error
          return Promise.reject(error);
        }).bind(this)
    });
  }


}


function storeFailedRequest(request: Request) : void {
  console.log('STOREFAILEDREQUEST : ' + request.url);
  console.log(request);
  let method = request.method;
  let url = request.url;

  // Log a fetch issue and store in the local cache
  switch (method) {
    case 'POST':        
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      console.log(method);
      console.log(url);

      let id = (new Date()).valueOf().toString();
      request.text().then((payload)=>{
        console.log('sw fetch fail : ' + method + ' ' + url);

        // Save the attempt for later replay
        let syncRecord = { id: id, url: url, method: method, payload: payload, headers: '', timestamp: (new Date()).valueOf() };
        db.table('requests').add(syncRecord).then((id)=>{ console.log('sw fetch logged in offline mode with id : ' + id); });
      });
      break;
    case 'OPTIONS':
      // Pre-flight check.  We need to handle this in some clever way
      console.log('FETCH INTERCEPTOR - Preflight OPTIONS check : should we do something with this?')
      break;
    default:
      break;
  }
}