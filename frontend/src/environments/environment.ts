// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  serviceWorkerScript: 'sw-sync.js',
  backendURL: window.location.protocol + '//' + window.location.hostname + ':3000',
  pingURL: window.location.protocol + '//' + window.location.hostname + ':3000/ping',
  fileUploadURL: window.location.protocol + '//' + window.location.hostname + ':3000/',
  websocketURL: window.location.protocol + '//' + window.location.hostname + ':3001',
  maxUploadImageWidth: 1000,
  maxUploadImageHeight: 1000,
  googleAPIKey: 'AIzaSyDc7ZjBGVhW5cLIp7EBPdvG9PGStRAQ9MY'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
