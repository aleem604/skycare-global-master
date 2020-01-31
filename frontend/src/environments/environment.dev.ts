

export const environment = {
  production: true,
  serviceWorkerScript: 'sw-master.js',
  backendURL: window.location.protocol + '//' + window.location.hostname,
  pingURL: window.location.protocol + '//' + window.location.hostname + '/ping',
  fileUploadURL: window.location.protocol + '//' + window.location.hostname + '/',
  websocketURL: window.location.protocol + '//skycare-ws.' + window.location.hostname.substring(window.location.hostname.indexOf('.')+1),
  maxUploadImageWidth: 1000,
  maxUploadImageHeight: 1000,
  googleAPIKey: 'AIzaSyDc7ZjBGVhW5cLIp7EBPdvG9PGStRAQ9MY'
};
