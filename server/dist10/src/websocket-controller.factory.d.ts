import { Constructor, Context } from '@loopback/context';
import { Socket } from 'socket.io';
export declare class WebSocketControllerFactory {
    private ctx;
    private controllerClass;
    private controller;
    constructor(ctx: Context, controllerClass: Constructor<{
        [method: string]: Function;
    }>);
    create(socket: Socket): Promise<{
        [method: string]: Function;
    }>;
    connect(socket: Socket): Promise<void>;
    registerSubscribeMethods(socket: Socket): Map<RegExp[], (...args: any[]) => Promise<void>>;
    /**
     * Set up the controller for the given socket
     * @param socket
     */
    setup(socket: Socket): Promise<void>;
}
