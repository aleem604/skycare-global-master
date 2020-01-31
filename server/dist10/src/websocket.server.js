"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("@loopback/context");
const websocket_decorator_1 = require("./decorators/websocket.decorator");
const websocket_controller_factory_1 = require("./websocket-controller.factory");
const SocketIOServer = require("socket.io");
const repositories_1 = require("./repositories");
const debug = require('debug')('loopback:websocket');
// tslint:disable:no-any
//export type SockIOMiddleware = (
//  socket: Socket,
//  fn: (err?: any) => void,
//) => void;
class WebSocketServer extends context_1.Context {
    constructor(httpServer, loopbackContext, options = {}) {
        super();
        this.httpServer = httpServer;
        this.loopbackContext = loopbackContext;
        this.options = options;
        this.io = SocketIOServer(options);
    }
    // Register a sock.io middleware function
    use(fn) {
        return this.io.use(fn);
    }
    /**
     * Register a websocket controller
     * @param ControllerClass
     * @param namespace
     */
    route(ControllerClass, namespace) {
        if (namespace == null) {
            const meta = websocket_decorator_1.getWebSocketMetadata(ControllerClass);
            namespace = meta && meta.namespace;
        }
        const nsp = namespace ? this.io.of(namespace) : this.io;
        nsp.on('connection', async (socket) => {
            debug('Websocket connected: id=%s namespace=%s', socket.id, socket.nsp.name);
            const reqCtx = new context_1.Context(this); // Create a request context      
            reqCtx.bind('ws.socket').to(socket); // Bind websocket  
            let cmr = await this.loopbackContext.getRepository(repositories_1.CaseMessageRepository); // Retrieve a CaseMessageRepository
            reqCtx.bind('repositories.CaseMessageRepository').to(cmr); // Add the CaseMessageRepository to context      
            let ccr = await this.loopbackContext.getRepository(repositories_1.CompanyCaseRepository); // Retrieve a CompanyCaseRepository
            reqCtx.bind('repositories.CompanyCaseRepository').to(ccr); // Add the CompanyCaseRepository to context      
            let cr = await this.loopbackContext.getRepository(repositories_1.CompanyRepository); // Retrieve a CompanyRepository
            reqCtx.bind('repositories.CompanyRepository').to(cr); // Add the CompanyRepository to context      
            await new websocket_controller_factory_1.WebSocketControllerFactory(reqCtx, ControllerClass).create(socket); // Instantiate the controller instance
        });
        return nsp;
    }
    // Start the websocket server
    async start() {
        await this.httpServer.start();
        const server = this.httpServer.server;
        this.io.attach(server, this.options);
    }
    // Stop the websocket server
    async stop() {
        const close = new Promise((resolve, reject) => { this.io.close(() => { resolve(); }); });
        await close;
        await this.httpServer.stop();
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=websocket.server.js.map