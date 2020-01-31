
import { Buffer } from 'buffer/';
import { v4 } from 'uuid';
import { encoder } from 'basex-encoder';
import * as JWTDecode from 'jwt-decode';

import Dexie from 'dexie';
import { NetworkMonitoringService } from './netmon.service';
import { Observable, of } from 'rxjs';


type OnlineDataRequestor = ()=>Observable<any>;
type OfflineDataRequestor = (table:Dexie.Table<any,string>)=>Dexie.Collection<any,string>;
type DataKeyIndexer = (dataset:any[])=>string[];
type DataCacheInserter = (table:Dexie.Table<any,string>)=>Promise<void>;



const ACCESS_TOKEN_KEY : string = 'ACCESS_TOKEN';
const USING_2FA_KEY : string = 'USING_2FA';

export class BaseService {

    public db : Dexie;

    private base62 : any = encoder('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

    private currentlyConnected : boolean = false;


    constructor(public readonly netmonService: NetworkMonitoringService,
                public dataCacheName : string = '') {

        this.currentlyConnected = netmonService.isOnline;
        this.listenForConnectionEvents(netmonService);

        if (dataCacheName != '') { this.createDataCacheSchema(); }
    }



    get connectionChanged() : Observable<boolean> {
        return this.netmonService.connectionChanged;
    }
    
  
    isAuthenticated(){ 
        // Retrieve the JWT for the current user
        const currentJWT : string = this.getJWT();
        if (currentJWT === undefined || currentJWT === null || currentJWT.trim().length == 0) { return false; }

        // Extract all the values from the JWT
        const parsedJWT : any = this.decodeJWT();

        // Make sure the JWT is not expired
        if (parsedJWT.exp < Date.now()) {
            localStorage.setItem(ACCESS_TOKEN_KEY, '');
            return false;
        } else {
            return true;
        }
    }

    getJWT() : string { return localStorage.getItem(ACCESS_TOKEN_KEY); }
  
    getTempJWT() : string { return localStorage.getItem('TEMP-'+ACCESS_TOKEN_KEY); }
    
    decodeJWT(useTemp : boolean = false){ 
      let jwt : string = (useTemp) ? this.getTempJWT() : this.getJWT();
      return JWTDecode(jwt); 
    }
  
    getRole(useTemp : boolean = false) : string { return (this.isAuthenticated()) ? this.decodeJWT(useTemp).role : ''; }
  
    getEmail(useTemp : boolean = false) : string { return (this.isAuthenticated()) ? this.decodeJWT(useTemp).email : ''; }
  
    getUsing2FA() : boolean { return (localStorage.getItem(USING_2FA_KEY) == 'true'); }
  
    getUserID(useTemp : boolean = false) : string {return (this.isAuthenticated()) ? this.decodeJWT(useTemp).sub : ''; }
  
    getName(useTemp : boolean = false) : string { return (this.isAuthenticated()) ? this.decodeJWT(useTemp).name : ''; }
  

    createUUID62() : string {
        const args = Array.prototype.slice.call(arguments);
        args[1] = new Buffer(16);
        let id = v4.apply(this, args);
    
        return `${'0'.repeat(32)}${this.base62.encodeFromBuffer(id)}`.slice(-32);
    }


    listenForConnectionEvents(netmonService : NetworkMonitoringService) : void {
        netmonService.connectionChanged.subscribe(online => {
            if (online) {
                console.log('we are connected');
            } else {
                console.log('we are disconnected');
            }
            this.currentlyConnected = online;
        });
    }

    createDataCacheSchema() : void {
        this.db = new Dexie('skycare');
        this.db.version(1).stores({
            profile: '&userID,&name,user.id,user.userID,user.name,user.email,user.role',
            activeCases: '&caseID,currentStatus',     
            caseMessages: '&messageID,caseID,senderID,sendDate,message',   
            caseDocuments: '&documentID,caseID,type,name,storageHash,createDate,modifyDate',
            caseDocumentFiles: '&documentID,caseID,expirationDate',
            progressNotes: '&patientProgressID,caseID',
            travelReceipts: '&receiptID,caseID,escortID,receiptDate,createDate,name,alternateName,storageHash,currencyType,amount,usdAmount',
            travelReceiptFiles: '&receiptID,caseID,expirationDate'
        });
        this.db.open();
    }

    getDataCacheTable(tableName : string = this.dataCacheName) : Dexie.Table<any, any> {
        let requestedTableIndex : number = this.db.tables.findIndex( (v,i,l) => {return v.name == tableName;} );
        if (requestedTableIndex == -1){
            throw new Error('Requested table does not exist in the data cache : ' + tableName);
        } else {
            return this.db.tables[requestedTableIndex];
        }
    }

    async clearDataCache(tableName : string = this.dataCacheName) : Promise<boolean> {
        try {
            let requestedTable : Dexie.Table<any, any> = this.getDataCacheTable(tableName);
            await requestedTable.clear();
            return true;
        } catch (err) {
            return false;
        }
    }

    async deleteDataCacheItem(key : string, tableName : string = this.dataCacheName) : Promise<boolean> {
        try {
            let requestedTable : Dexie.Table<any,any> = this.getDataCacheTable(tableName);
            await requestedTable.delete(key);
            return true;
        } catch (err) {
            return false;
        }
    }

    async getCacheableData( onlineRequest : OnlineDataRequestor, 
                            offlineRequest : OfflineDataRequestor, 
                            keyIndexer : DataKeyIndexer, 
                            tableName : string = this.dataCacheName) : Promise<Observable<any[]>> {

        // NOTE: We should only use the data cache if this is an Escort AND we are offline
        // Determine the current user is an Escort
        let currentUserIsEscort : boolean = (this.getRole() == 'escort');
        try {
            // Retrieve the data cache table from local storage
            let requestedTable : Dexie.Table<any,any> = this.getDataCacheTable(tableName);
            
            console.log('Current Connected = ' + this.currentlyConnected);
            if (!this.currentlyConnected && currentUserIsEscort) { return of( await offlineRequest.call(this,requestedTable).toArray() ); }

            // We are online and/or not an Escort, so request the data from remote storage
            let requestedData : any = await onlineRequest.call(this).toPromise();
            if (!Array.isArray(requestedData)) { requestedData = [requestedData]; }

            // Get the index of keys from the remote storage data
            let keyIndex : string[] = keyIndexer(requestedData);
            console.log('INFO: got the keyindex for some cacheable data');
            console.log(keyIndex);

            if (keyIndex.length > 0) { 
                // Bulk delete the items in local storage that are in the index of keys retrieved from remote storage
                await requestedTable.bulkDelete(keyIndex);

                // Bulk insert all items from remote storage into local storage
                await requestedTable.bulkAdd(requestedData);
            }

            // Return all items retreived from remote storage
            console.log('INFO: found some cacheable data');
            console.log(requestedData);
            return of(requestedData);            
        } catch (err) {
            return of([]);
        }
    }

    async getCacheableDataLazy( onlineRequest : OnlineDataRequestor, 
                                offlineRequest : OfflineDataRequestor, 
                                keyIndexer : DataKeyIndexer, 
                                tableName : string = this.dataCacheName,
                                cacheItemExpiration : number = (1000 * 60 * 60 * 24 * 30)) : Promise<Observable<any[]>> {        

        // NOTE: We should only use the data cache if this is an Escort AND we are offline
        // Determine the current user is an Escort
        let currentUserIsEscort : boolean = (this.getRole() == 'escort');
        let today : number = (new Date()).valueOf();

        try {
            // Retrieve the data cache table from local storage
            let requestedTable : Dexie.Table<any,any> = this.getDataCacheTable(tableName);

            // Request the data from the cache so we can see if it is not expired yet
            let cachedData : any[] = await offlineRequest.call(this, requestedTable).toArray();

            // Check if any item in the cache was expired or if we are currently offline
            let anyCacheItemExpired : boolean = cachedData.some( (v,i,l)=>{ return v.expirationDate <= today; });
            if ( currentUserIsEscort && ((cachedData.length > 0 && !anyCacheItemExpired) || !this.currentlyConnected)) { return of(cachedData); } 
            
            // Delete all the cached items from the offline query
            let keyIndex : string[] = keyIndexer(cachedData);
            console.log(keyIndex.length);
            if (keyIndex.length >= 1) { 
                await requestedTable.bulkDelete(keyIndex); 
            }
            
            // Request the data from remote storage
            let requestedData : any = await onlineRequest.call(this).toPromise();
            if (!Array.isArray(requestedData)) { requestedData = [requestedData]; }

            // Create an expirable record in the data cache for each retrieved item
            if (requestedData.length > 0) { 
                let expirationDate : number = today + cacheItemExpiration;
                for (let i = 0; i < requestedData.length; i++) { requestedData[i]['expirationDate'] = expirationDate; }

                // Bulk insert all items from remote storage into local storage
                await requestedTable.bulkAdd(requestedData);
            }

            // Return all items retreived from remote storage
            console.log('INFO: retrieved items from remote storage');
            console.log(requestedData);
            return of(requestedData);            
        } catch (err) {
            console.log('ERROR: Something went wrong while retrieving cached data lazily');
            console.log(err);
            return of([]);
        }
    }

    async addDataToCache(insertCommand : DataCacheInserter, tableName : string = this.dataCacheName) : Promise<void> {
        try {          
            console.log('Looking for table ' + tableName + ' in the offline cache');
            // Retrieve the data cache table from local storage
            let requestedTable : Dexie.Table<any,any> = this.getDataCacheTable(tableName);

            // Execute the cache insertion command
            console.log('Inserting data into offline cache');
            await insertCommand.call(this, requestedTable);            
        } catch (err) {
            console.log('Error while adding to offline cache');
            console.log(err);
        }
        return;
    }

}