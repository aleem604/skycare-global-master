import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'hammerjs';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).then(ref => {
  // Ensure Angular destroys itself on hot reloads.
  if (window['ngRef']) {
    window['ngRef'].destroy();
  }
  window['ngRef'] = ref;

  // Add the service worker
  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller && navigator.serviceWorker.controller.state == 'activated') { return; }
    navigator.serviceWorker.register(environment.serviceWorkerScript, { scope: './' }).then((reg)=> {
      console.log('Service worker registered');
    });
  }

  // Otherwise, log the boot error
}).catch(err => console.log(err));

function serializeObject(obj){
  let returnValue = '';
  for(let i in obj){
    returnValue += '\n' + i + ' = ' + obj[i];
  }
  return returnValue;
}
