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
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const authentication_1 = require("@loopback/authentication");
let AppFeedbacksController = class AppFeedbacksController {
    constructor(appFeedbackRepository) {
        this.appFeedbackRepository = appFeedbackRepository;
    }
    async create(appFeedback) {
        return await this.appFeedbackRepository.create(appFeedback);
    }
    async find(filter) {
        return await this.appFeedbackRepository.find(filter);
    }
};
__decorate([
    rest_1.post('/app-feedbacks', {
        responses: {
            '200': {
                description: 'AppFeedback model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.AppFeedback } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.AppFeedback]),
    __metadata("design:returntype", Promise)
], AppFeedbacksController.prototype, "create", null);
__decorate([
    rest_1.get('/app-feedbacks', {
        responses: {
            '200': {
                description: 'Array of AppFeedback model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.AppFeedback } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.AppFeedback))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppFeedbacksController.prototype, "find", null);
AppFeedbacksController = __decorate([
    __param(0, repository_1.repository(repositories_1.AppFeedbackRepository)),
    __metadata("design:paramtypes", [repositories_1.AppFeedbackRepository])
], AppFeedbacksController);
exports.AppFeedbacksController = AppFeedbacksController;
//# sourceMappingURL=app-feedbacks.controller.js.map