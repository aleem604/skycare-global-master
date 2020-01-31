import { Constructor, Context } from '@loopback/context';
import { HttpServer } from '@loopback/http-server';
import { Server, ServerOptions, Socket } from 'socket.io';
import SocketIOServer = require('socket.io');
import { ServerApplication } from '.';
export declare class WebSocketServer extends Context {
    readonly httpServer: HttpServer;
    loopbackContext: ServerApplication;
    private options;
    private io;
    constructor(httpServer: HttpServer, loopbackContext: ServerApplication, options?: ServerOptions);
    use(fn: (socket: Socket, fn: (err?: any) => void) => void): SocketIOServer.Namespace;
    /**
     * Register a websocket controller
     * @param ControllerClass
     * @param namespace
     */
    route(ControllerClass: Constructor<any>, namespace?: string | RegExp): Server | SocketIOServer.Namespace;
    start(): Promise<void>;
    stop(): Promise<void>;
}
