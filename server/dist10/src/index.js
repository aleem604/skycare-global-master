"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const application_1 = require("./application");
exports.ServerApplication = application_1.ServerApplication;
const dbGenerator_1 = require("./dbGenerator");
const datasourceCloudant = require('./datasources/cloudant.datasource.json');
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
let dbCreationStarted = false;
async function main(options = {}) {
    if (!options.rest) {
        options.rest = { port: 3000, host: '127.0.0.1' };
    }
    options.rest.port = appEnv.isLocal ? options.rest.port : appEnv.port;
    options.rest.host = appEnv.isLocal ? options.rest.host : appEnv.host;
    const app = new application_1.ServerApplication(options);
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
        await dbGenerator_1.createDB(app);
    }
    const rest_url = app.restServer.url;
    const ws_url = app.httpServer.url;
    console.log(`REST server is running at ${rest_url}`);
    console.log(`WS Server is running at ${ws_url}`);
    return app;
}
exports.main = main;
//# sourceMappingURL=index.js.map