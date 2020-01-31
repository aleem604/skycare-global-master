import { BootMixin, Binding, Booter }                             from '@loopback/boot';
import { ApplicationConfig }                                      from '@loopback/core';
import { Provider }                                               from '@loopback/context';
import { RestApplication, RestServer, RestBindings }              from '@loopback/rest';
import { ServiceMixin, Class }                                    from '@loopback/service-proxy';
import { RestExplorerBindings, RestExplorerComponent }            from '@loopback/rest-explorer';
import { HttpServer }                                             from '@loopback/http-server';
import { AuthenticationComponent, AuthenticationBindings }        from '@loopback/authentication';
import { RepositoryMixin, Repository }                            from '@loopback/repository';
import { DataSource }                                             from 'loopback-datasource-juggler'
//import { Class } from '@loopback/repository/dist/src/common-types'


import { MySequence }                                             from './sequence';
import { AuthStrategyProvider }                                   from './authentication';
import { CaseMessagesWSController }                               from './controllers';
import { WebSocketServer }                                        from './websocket.server';

import * as express from 'express';
import * as fs  from 'fs';
import * as path from 'path';

const debug = require('debug')('loopback:websocket');



export class ServerApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {

  public httpServer: HttpServer;
  public wsServer: WebSocketServer;



  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.configureRESTServer(options);
    this.configureWSServer(options);
  }


  configureRESTServer(options: ApplicationConfig) {
    // Set up default home page
    this.static('/', path.join(__dirname, '../../public'));
    this.projectRoot = __dirname;

    // Customize the authentication configuration
    this.component(AuthenticationComponent);
    this.bind(AuthenticationBindings.STRATEGY).toProvider(
      AuthStrategyProvider,
    );

    // Set up the custom sequence
    this.sequence(MySequence);

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


  configureWSServer(options: ApplicationConfig) {
    const expressApp = express();
    const root = path.resolve(__dirname, '../../public');
    expressApp.use('/', express.static(root));

    // Create an http server backed by the Express app
    this.httpServer = new HttpServer(expressApp, options.websocket);

    // Create ws server from the http server
    const wsServer = new WebSocketServer(this.httpServer, this);
    this.bind('servers.websocket.server1').to(wsServer);

    // Middleware needs to create a socket, not bound to a namespace yet
    wsServer.use((socket:any, next:any) => {
      debug('NEW CLIENT - socket:', socket.id);
      next();
    });

    // Create a namespaces for distributing CaseMessages
    const ns = wsServer.route(CaseMessagesWSController, /^\/messages\/[\w\d]{32}$/);

    // Handler for new sockets that are joining this namespace 
    ns.use((socket:any, next:any) => {
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
