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
let CompanyUsersController = class CompanyUsersController {
    constructor(companyUserRepository, companyRepository, userRepository) {
        this.companyUserRepository = companyUserRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }
    async create(companyUser) {
        return await this.companyUserRepository.create(companyUser);
    }
    async count(where) {
        return await this.companyUserRepository.count(where);
    }
    async find(filter) {
        let companyUsers = await this.companyUserRepository.find(filter);
        if (companyUsers.length == 0) {
            return companyUsers;
        }
        let userCriteria = companyUsers.map((v, i, l) => { return { userID: v.userID }; });
        let userFilter = { where: { or: userCriteria } };
        let users = await this.userRepository.find(userFilter);
        for (let ix = 0; ix < companyUsers.length; ix++) {
            let userIndex = users.findIndex((v, i, l) => { return v.userID == companyUsers[ix].userID; });
            if (userIndex > -1) {
                users[userIndex].password = '';
                users[userIndex].key2FA = '';
                companyUsers[ix].user = users[userIndex];
            }
        }
        let companyCriteria = companyUsers.map((v, i, l) => { return { companyID: v.companyID }; });
        let companyFilter = { where: { or: companyCriteria } };
        let companies = await this.companyRepository.find(companyFilter);
        for (let ix = 0; ix < companyUsers.length; ix++) {
            let companyIndex = companies.findIndex((v, i, l) => { return v.companyID == companyUsers[ix].companyID; });
            if (companyIndex > -1) {
                companyUsers[ix].company = companies[companyIndex];
            }
        }
        return companyUsers;
    }
    async updateAll(companyUser, where) {
        return await this.companyUserRepository.updateAll(companyUser, where);
    }
    async findById(id) {
        return await this.companyUserRepository.findById(id);
    }
    async updateById(id, companyUser) {
        await this.companyUserRepository.updateById(id, companyUser);
    }
    async deleteById(id) {
        await this.companyUserRepository.deleteById(id);
    }
};
__decorate([
    rest_1.post('/company-users', {
        responses: {
            '200': {
                description: 'CompanyUser model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CompanyUser } } },
            },
        },
    }),
    __param(0, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.CompanyUser]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "create", null);
__decorate([
    rest_1.get('/company-users/count', {
        responses: {
            '200': {
                description: 'CompanyUser model count',
                content: { 'application/json': { schema: repository_1.CountSchema } },
            },
        },
    }),
    __param(0, rest_1.param.query.object('where', rest_1.getWhereSchemaFor(models_1.CompanyUser))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "count", null);
__decorate([
    rest_1.get('/company-users', {
        responses: {
            '200': {
                description: 'Array of CompanyUser model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CompanyUser } },
                    },
                },
            },
        },
    }),
    __param(0, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CompanyUser))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "find", null);
__decorate([
    rest_1.patch('/company-users', {
        responses: {
            '200': {
                description: 'CompanyUser PATCH success count',
                content: { 'application/json': { schema: repository_1.CountSchema } },
            },
        },
    }),
    __param(0, rest_1.requestBody()),
    __param(1, rest_1.param.query.object('where', rest_1.getWhereSchemaFor(models_1.CompanyUser))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [models_1.CompanyUser, Object]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "updateAll", null);
__decorate([
    rest_1.get('/company-users/{id}', {
        responses: {
            '200': {
                description: 'CompanyUser model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CompanyUser } } },
            },
        },
    }),
    __param(0, rest_1.param.path.string('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "findById", null);
__decorate([
    rest_1.patch('/company-users/{id}', {
        responses: {
            '204': {
                description: 'CompanyUser PATCH success',
            },
        },
    }),
    __param(0, rest_1.param.path.string('id')),
    __param(1, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, models_1.CompanyUser]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "updateById", null);
__decorate([
    rest_1.del('/company-users/{id}', {
        responses: {
            '204': {
                description: 'CompanyUser DELETE success',
            },
        },
    }),
    __param(0, rest_1.param.path.string('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyUsersController.prototype, "deleteById", null);
CompanyUsersController = __decorate([
    __param(0, repository_1.repository(repositories_1.CompanyUserRepository)),
    __param(1, repository_1.repository(repositories_1.CompanyRepository)),
    __param(2, repository_1.repository(repositories_1.UserRepository)),
    __metadata("design:paramtypes", [repositories_1.CompanyUserRepository,
        repositories_1.CompanyRepository,
        repositories_1.UserRepository])
], CompanyUsersController);
exports.CompanyUsersController = CompanyUsersController;
//# sourceMappingURL=company-users.controller.js.map