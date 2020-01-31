"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("@loopback/context");
const rest_1 = require("@loopback/rest");
const authentication_1 = require("@loopback/authentication");
const jwt_simple_1 = require("jwt-simple");
const config_1 = require("./config");
const SequenceActions = rest_1.RestBindings.SequenceActions;
let MySequence = class MySequence {
    constructor(findRoute, parseParams, invoke, send, reject, authenticateRequest) {
        this.findRoute = findRoute;
        this.parseParams = parseParams;
        this.invoke = invoke;
        this.send = send;
        this.reject = reject;
        this.authenticateRequest = authenticateRequest;
    }
    async handle(context) {
        try {
            const { request, response } = context;
            //response.setHeader('Access-Control-Allow-Origins', '*');
            response.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, PUT, DELETE, OPTIONS');
            response.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, X-Requested-With');
            response.setHeader('Access-Control-Allow-Credentials', 'true');
            const route = this.findRoute(request);
            if (route.path != '/ping') {
                console.log(route.path);
            }
            // !!IMPORTANT: authenticateRequest fails on static routes!
            if (!(route instanceof rest_1.ExternalExpressRoutes)) {
                const user = await this.authenticateRequest(request);
                if (user &&
                    ((request.headers.authorization && request.headers.authorization.indexOf('Basic') == 0) ||
                        (user.role == 'limited'))) {
                    // Allow users with Basic login to get an extended expiration if they requested "rememberMe"
                    let expirationMultiplier = 1;
                    if (Object.keys(request.query).indexOf('rememberMe') > -1 && (request.query.rememberMe == "true")) {
                        expirationMultiplier = 1095;
                    }
                    const jwt = jwt_simple_1.encode({
                        sub: user.id,
                        iss: config_1.Config.jwt.issuer,
                        aud: config_1.Config.jwt.audience,
                        exp: (new Date()).valueOf() + (expirationMultiplier * 24 * 60 * 60 * 1000),
                        iat: (new Date()).valueOf(),
                        name: user.name,
                        email: (user.email) ? user.email.toLowerCase() : '',
                        role: user.role,
                        caseID: (user.caseID) ? user.caseID : '',
                        using2FA: user.using2FA
                    }, config_1.Config.jwt.encryptingKey, config_1.Config.jwt.algorithm);
                    response.setHeader('Access-Control-Expose-Headers', 'Authorization');
                    response.setHeader('Authorization', 'Bearer ' + jwt);
                }
            }
            const args = await this.parseParams(request, route);
            const result = await this.invoke(route, args);
            this.send(response, result);
        }
        catch (err) {
            if (err.name && err.name == 'NotFoundError') {
                console.log('default redirect');
                context.response.sendFile('public/index.html', { root: './' });
            }
            else {
                console.log('CAUGHT AN ERROR');
                console.log(err);
                this.reject(context, err);
            }
        }
    }
};
MySequence = __decorate([
    __param(0, context_1.inject(SequenceActions.FIND_ROUTE)),
    __param(1, context_1.inject(SequenceActions.PARSE_PARAMS)),
    __param(2, context_1.inject(SequenceActions.INVOKE_METHOD)),
    __param(3, context_1.inject(SequenceActions.SEND)),
    __param(4, context_1.inject(SequenceActions.REJECT)),
    __param(5, context_1.inject(authentication_1.AuthenticationBindings.AUTH_ACTION)),
    __metadata("design:paramtypes", [Function, Function, Function, Function, Function, Function])
], MySequence);
exports.MySequence = MySequence;
//# sourceMappingURL=sequence.js.map