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
const context_1 = require("@loopback/context");
const authentication_1 = require("@loopback/authentication");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
let CompaniesController = class CompaniesController {
    constructor(user, companyRepository, userRepository) {
        this.user = user;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }
    async find(filter) {
        return await this.companyRepository.find(filter);
    }
    async findById(companyID) {
        return await this.companyRepository.findById(companyID);
    }
    async updateById(companyID, company) {
        // Update the Company Profile by its ID
        await this.companyRepository.updateById(companyID, company);
        // Get the User record from the database for the current User
        let currentUser = await this.userRepository.findById(this.user.id);
        // Update the User record with the same name that was provided as part of the Company Profile
        currentUser.name = company.name;
        // Update the User record in the database
        await this.userRepository.updateById(currentUser.userID, currentUser);
        return true;
    }
};
__decorate([
    rest_1.get('/companies', {
        responses: {
            '200': {
                description: 'Array of Company model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.Company } },
                    },
                },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.Company))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "find", null);
__decorate([
    rest_1.get('/companies/{companyID}', {
        responses: {
            '200': {
                description: 'Company model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.Company } } },
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findById", null);
__decorate([
    rest_1.patch('/companies/{companyID}', {
        responses: {
            '204': {
                description: 'Company PATCH success',
            },
        },
    }),
    authentication_1.authenticate('JWTStrategy'),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, models_1.Company]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "updateById", null);
CompaniesController = __decorate([
    __param(0, context_1.inject(authentication_1.AuthenticationBindings.CURRENT_USER)),
    __param(1, repository_1.repository(repositories_1.CompanyRepository)),
    __param(2, repository_1.repository(repositories_1.UserRepository)),
    __metadata("design:paramtypes", [Object, repositories_1.CompanyRepository,
        repositories_1.UserRepository])
], CompaniesController);
exports.CompaniesController = CompaniesController;
//# sourceMappingURL=companies.controller.js.map