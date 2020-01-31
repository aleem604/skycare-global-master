//(function () {
    'use strict';
  
    importScripts('dexie.min.js');
  
    const db = new Dexie("skycare-sync");
    let currentSyncItemIndex = 0;
  
    db.version(1).stores({
        requests: '&id,url,method,payload,headers,timestamp'
    });
    db.open();
  

    //if (self.onmessage == null) { self.onmessage = messageHandler; }
    self.addEventListener('message', function(event){
      console.log('SW MESSAGE : ' + JSON.stringify(event));
      if (event.data == 'reload') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
              registration.update();
            }
          })
        }
      } else if(event.data == 'start_sync') {
        console.log('SW MESSAGE: Sync start requested');
        currentSyncItemIndex = 0;

        db.requests.count().then((requestCount)=>{
          console.log('SW MESSAGE : found ' + requestCount + ' items to sync');
          let syncSummary = {
            totalItemsToSync: requestCount,
            currentSyncItemIndex: currentSyncItemIndex,
            description: 'Starting server sync...',
            type: 'sync_started'
          };
          console.log('sw sync start : ' + JSON.stringify(event));
          event.ports[0].postMessage(syncSummary);
          return true;
        });
      } else if (event.data == 'sync') {
        console.log('SW MESSAGE: Sync execution requested');
        startServerSync(event).then((success)=>{
          if (success) { console.log('SW MESSAGE: Sync execution completed successfully.'); }
          else { console.log('SW MESSAGE: Sync execution failed for some reason'); }
          return success;
        });
      } else if (event.data == 'sync_request_finished') {
        console.log('SW MESSAGE: Sync next item requested');

        // We need to remove the first item in the list of pending sync requests
        db.requests.orderBy('timestamp').toArray((sortedRequests)=>{
          if (sortedRequests.length == 0) { 
            console.log('SW MESSAGE: Cannot complete the last request, because no requests were pending');
            return false;
          }

          db.requests.delete(sortedRequests[0].id).then((success)=>{
            if (sortedRequests.length == 1) {
              console.log('SW MESSAGE: Finalized the last request needing to be synced.');
              let finalizeSync = { type: 'sync_finished' };
              return syncRequestToServer(event, finalizeSync);
            } else {
              sortedRequests[1].type = 'sync_request';
              return syncRequestToServer(event, sortedRequests[1]);
            }
          });
        });

      }
    });

    /*
    console.log('Adding a fetch handler');
    self.addEventListener('fetch', function(event) {
      switch (event.request.clone().method) {
        case 'POST':        
        case 'PUT':
        case 'PATCH':
        case 'DELETE':
          console.log('Attempting fetch');
          console.log(event.request.clone().method);
          console.log(event.request.clone().url);

          // attempt to send request normally
          event.respondWith( fetch(event.request.clone())
                            .catch((error)=>{
                              console.log('Attempted fetch failed');
                              console.log(error);

                              let copyOfRequest = event.request.clone();
                              let id = (new Date()).valueOf().toString();
                              let url = copyOfRequest.url;

                              // Do not sync logins or attempts at escort tracking
                              if (url.indexOf('tracking') > -1 || url.indexOf('login') > -1) { return; }

                              let method = copyOfRequest.method;
                              copyOfRequest.text().then((payload)=>{
                                console.log('sw fetch fail : ' + method + ' ' + url);
                                console.log('Failed request: ', url);
  
                                // Save the attempt for later replay
                                let syncRecord = { id: id, url: url, method: method, payload: payload, headers: '', timestamp: (new Date()).valueOf() };
                                db.requests.add(syncRecord);
                              });
                            })
          );
          break;
        case 'OPTIONS':
          // Pre-flight check.  We need to handle this in some clever way
          console.log(event);
          console.log('set breakpoint here');
          break;

        default:
          break;
      }
    });
    console.log('Fetch handler added through event listener');
    */

    self.addEventListener('install', function(event) {
      event.waitUntil(self.skipWaiting()); // Activate worker immediately
    });    
    self.addEventListener('activate', function(event) {
      event.waitUntil(self.clients.claim()); // Become available to all pages
    });

    



    function startServerSync(event) {
      // Make sure we are looking at the requests in sorted time order
      return new Promise( (resolve, reject) => {
        db.requests.orderBy('timestamp').toArray((sortedRequests) => {
          if (sortedRequests.length == 0) { resolve(true); return; }
            
          currentSyncItemIndex++;
          sortedRequests[0]['type'] = 'sync_request';
          sortedRequests[0]['currentSyncItemIndex'] = currentSyncItemIndex;

          // Extract the path from the URL
          let currentPath = sortedRequests[0].url.replace('https://', '').replace('http://', '');
          currentPath = currentPath.substring(currentPath.lastIndexOf('/'));

          sortedRequests[0]['description'] = 'Syncing ' + currentPath;

          resolve(syncRequestToServer(event, sortedRequests[0]));
          return; 
        });
      })
    }

    function syncRequestToServer(event, request) {
      console.log('SW MESSAGE: Sending a request to the server through the MessageChannel');
      event.ports[0].postMessage(request);
      return true;
    }

    
  //}());
