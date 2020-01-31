"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boot_1 = require("@loopback/boot");
const rest_1 = require("@loopback/rest");
const service_proxy_1 = require("@loopback/service-proxy");
const http_server_1 = require("@loopback/http-server");
const authentication_1 = require("@loopback/authentication");
const repository_1 = require("@loopback/repository");
//import { Class } from '@loopback/repository/dist/src/common-types'
const sequence_1 = require("./sequence");
const authentication_2 = require("./authentication");
const controllers_1 = require("./controllers");
const websocket_server_1 = require("./websocket.server");
const express = require("express");
const path = require("path");
const debug = require('debug')('loopback:websocket');
class ServerApplication extends boot_1.BootMixin(service_proxy_1.ServiceMixin(repository_1.RepositoryMixin(rest_1.RestApplication))) {
    constructor(options = {}) {
        super(options);
        this.configureRESTServer(options);
        this.configureWSServer(options);
    }
    configureRESTServer(options) {
        // Set up default home page
        this.static('/', path.join(__dirname, '../../public'));
        this.projectRoot = __dirname;
        // Customize the authentication configuration
        this.component(authentication_1.AuthenticationComponent);
        this.bind(authentication_1.AuthenticationBindings.STRATEGY).toProvider(authentication_2.AuthStrategyProvider);
        // Set up the custom sequence
        this.sequence(sequence_1.MySequence);
        // Customize @loopback/rest-explorer configuration here
        //this.bind(RestExplorerBindings.CONFIG).to({
        //  path: '/explorer',
        //});
        //this.component(RestExplorerComponent);
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
                dirs: ['controllers'],
                extensions: ['.controller.js'],
                nested: true,
            },
        };
    }
    configureWSServer(options) {
        const expressApp = express();
        const root = path.resolve(__dirname, '../../public');
        expressApp.use('/', express.static(root));
        // Create an http server backed by the Express app
        this.httpServer = new http_server_1.HttpServer(expressApp, options.websocket);
        // Create ws server from the http server
        const wsServer = new websocket_server_1.WebSocketServer(this.httpServer, this);
        this.bind('servers.websocket.server1').to(wsServer);
        // Middleware needs to create a socket, not bound to a namespace yet
        wsServer.use((socket, next) => {
            debug('NEW CLIENT - socket:', socket.id);
            next();
        });
        // Create a namespaces for distributing CaseMessages
        const ns = wsServer.route(controllers_1.CaseMessagesWSController, /^\/messages\/[\w\d]{32}$/);
        // Handler for new sockets that are joining this namespace 
        ns.use((socket, next) => {
            debug('NEW CLIENT JOINED NAMESPACE - namespace: ', socket.nsp.name);
            next();
        });
        this.wsServer = wsServer;
    }
    async start() {
        await super.start();
        await this.wsServer.start();
        //const server = await this.getServer(RestServer);
        //const port = await server.get(RestBindings.PORT);
        //console.log(`REST server running on port: ${port}`);
    }
    async stop() {
        await super.stop();
        await this.wsServer.stop();
    }
}
exports.ServerApplication = ServerApplication;
//# sourceMappingURL=application.js.map