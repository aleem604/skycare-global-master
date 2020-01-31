import {ServerApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import {createDB, updateDB} from "./dbGenerator";

const datasourceCloudant = require('./datasources/cloudant.datasource.json');
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();

export {ServerApplication};


let dbCreationStarted : boolean = false;

export async function main(options: ApplicationConfig = {}) {

  if (!options.rest) { options.rest = { port: 3000, host: '127.0.0.1' }; } 
  options.rest.port = appEnv.isLocal ? options.rest.port : appEnv.port;
  options.rest.host = appEnv.isLocal ? options.rest.host : appEnv.host;

  const app = new ServerApplication(options);

  if (!appEnv.isLocal) {
    const updatedDatasourceDB = Object.assign({}, datasourceCloudant, {
      url: appEnv.getServiceURL('Database'),
      account: appEnv.getServiceCreds('Database').username,
      username: appEnv.getServiceCreds('Database').username,
      password: appEnv.getServiceCreds('Database').password
    });
    app.bind('datasources.config.cloudant').to(updatedDatasourceDB);
  }


  await app.boot();
  await app.start();

  if (process.env.CREATE_DB == 'true' && !dbCreationStarted) {
    dbCreationStarted = true;
    await createDB(app);
  }

  const rest_url = app.restServer.url;
  const ws_url = app.httpServer.url;
  console.log(`REST server is running at ${rest_url}`);
  console.log(`WS Server is running at ${ws_url}`);

  return app;
}
