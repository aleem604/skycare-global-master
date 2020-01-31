import {Constructor, Context} from '@loopback/context';
import {HttpServer} from '@loopback/http-server';
import {Server, ServerOptions, Socket} from 'socket.io';
import {getWebSocketMetadata} from './decorators/websocket.decorator';
import {WebSocketControllerFactory} from './websocket-controller.factory';
import SocketIOServer = require('socket.io');
import { ServerApplication } from '.';
import { CaseMessageRepository, CompanyCaseRepository, CompanyRepository } from './repositories';

const debug = require('debug')('loopback:websocket');

// tslint:disable:no-any
//export type SockIOMiddleware = (
//  socket: Socket,
//  fn: (err?: any) => void,
//) => void;


export class WebSocketServer extends Context {
    
  private io: Server;

  constructor( public readonly httpServer: HttpServer, public loopbackContext : ServerApplication, private options: ServerOptions = {} ) {
    super();
    this.io = SocketIOServer(options);
  }

  // Register a sock.io middleware function
  use(fn: (socket: Socket, fn: (err?: any) => void) => void) {
    return this.io.use(fn);
  }

  /**
   * Register a websocket controller
   * @param ControllerClass
   * @param namespace
   */
  route(ControllerClass: Constructor<any>, namespace?: string | RegExp) {
    if (namespace == null) {
      const meta = getWebSocketMetadata(ControllerClass);
      namespace = meta && meta.namespace;
    }

    const nsp = namespace ? this.io.of(namespace) : this.io;
    nsp.on('connection', async socket => {
      debug( 'Websocket connected: id=%s namespace=%s', socket.id, socket.nsp.name );
      
      const reqCtx = new Context(this);                                                 // Create a request context      
      reqCtx.bind('ws.socket').to(socket);                                              // Bind websocket  
      let cmr : CaseMessageRepository = 
          await this.loopbackContext.getRepository(CaseMessageRepository);              // Retrieve a CaseMessageRepository
      reqCtx.bind('repositories.CaseMessageRepository').to(cmr);                        // Add the CaseMessageRepository to context      
       
      let ccr : CompanyCaseRepository = 
          await this.loopbackContext.getRepository(CompanyCaseRepository);              // Retrieve a CompanyCaseRepository
      reqCtx.bind('repositories.CompanyCaseRepository').to(ccr);                        // Add the CompanyCaseRepository to context      
       
      let cr : CompanyRepository = 
          await this.loopbackContext.getRepository(CompanyRepository);                  // Retrieve a CompanyRepository
      reqCtx.bind('repositories.CompanyRepository').to(cr);                             // Add the CompanyRepository to context      

      await new WebSocketControllerFactory(reqCtx, ControllerClass).create( socket );   // Instantiate the controller instance
    });
    return nsp;
  }

  // Start the websocket server
  async start() {
    await this.httpServer.start();
    const server = (this.httpServer as any).server;
    this.io.attach(server, this.options);
  }

  // Stop the websocket server
  async stop() {
    const close = new Promise<void>((resolve, reject) => { this.io.close(() => { resolve(); }); });
    await close;
    await this.httpServer.stop();
  }
}