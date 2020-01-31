import { Constructor, MetadataAccessor } from '@loopback/context';
export interface WebSocketMetadata {
    namespace?: string | RegExp;
}
export declare const WEBSOCKET_METADATA: MetadataAccessor<WebSocketMetadata, ClassDecorator>;
/**
 * Decorate a websocket controller class to specify the namespace
 * For example,
 * ```ts
 * @ws({namespace: '/chats'})
 * export class WebSocketController {}
 * ```
 * @param spec A namespace or object
 */
export declare function ws(spec?: WebSocketMetadata | string | RegExp): ClassDecorator;
export declare function getWebSocketMetadata(controllerClass: Constructor<any>): WebSocketMetadata | undefined;
export declare namespace ws {
    function socket(): (target: Object, member: string | undefined, methodDescriptorOrParameterIndex?: number | TypedPropertyDescriptor<any> | undefined) => void;
    /**
     * Decorate a method to subscribe to websocket events.
     * For example,
     * ```ts
     * @ws.subscribe('chat message')
     * async function onChat(msg: string) {
     * }
     * ```
     * @param messageTypes
     */
    function subscribe(...messageTypes: (string | RegExp)[]): MethodDecorator;
    /**
     * Decorate a controller method for `disconnect`
     */
    function disconnect(): MethodDecorator;
    /**
     * Decorate a controller method for `connect`
     */
    function connect(): MethodDecorator;
}
