"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("@loopback/context");
exports.WEBSOCKET_METADATA = context_1.MetadataAccessor.create('websocket');
/**
 * Decorate a websocket controller class to specify the namespace
 * For example,
 * ```ts
 * @ws({namespace: '/chats'})
 * export class WebSocketController {}
 * ```
 * @param spec A namespace or object
 */
function ws(spec = {}) {
    if (typeof spec === 'string' || spec instanceof RegExp) {
        spec = { namespace: spec };
    }
    return context_1.ClassDecoratorFactory.createDecorator(exports.WEBSOCKET_METADATA, spec);
}
exports.ws = ws;
function getWebSocketMetadata(controllerClass) {
    return context_1.MetadataInspector.getClassMetadata(exports.WEBSOCKET_METADATA, controllerClass);
}
exports.getWebSocketMetadata = getWebSocketMetadata;
(function (ws) {
    function socket() {
        return context_1.inject('ws.socket');
    }
    ws.socket = socket;
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
    function subscribe(...messageTypes) {
        return context_1.MethodDecoratorFactory.createDecorator('websocket:subscribe', messageTypes);
    }
    ws.subscribe = subscribe;
    /**
     * Decorate a controller method for `disconnect`
     */
    function disconnect() {
        return subscribe('disconnect');
    }
    ws.disconnect = disconnect;
    /**
     * Decorate a controller method for `connect`
     */
    function connect() {
        return context_1.MethodDecoratorFactory.createDecorator('websocket:connect', true);
    }
    ws.connect = connect;
})(ws = exports.ws || (exports.ws = {}));
//# sourceMappingURL=websocket.decorator.js.map