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
let CasePatientProgressesController = class CasePatientProgressesController {
    constructor(casePatientProgressRepository) {
        this.casePatientProgressRepository = casePatientProgressRepository;
    }
    async create(companyID, caseID, casePatientProgress) {
        // Ensure that the provided CasePatientProgress has a caseID that matches the path caseID
        if (casePatientProgress.caseID != caseID) {
            throw new rest_1.HttpErrors.BadRequest("CasePatientProgress.caseID does not match the URL path caseID");
        }
        // Make sure that now other CasePatientProgress records exist for this caseID
        let recordCount = await this.casePatientProgressRepository.count({ caseID: caseID });
        if (recordCount.count > 0) {
            throw new rest_1.HttpErrors.BadRequest("A CasePatientProgress record already exists for a Case with caseID : " + caseID);
        }
        // Create the CasePatientProgress
        return await this.casePatientProgressRepository.create(casePatientProgress);
    }
    async find(companyID, caseID, filter) {
        // Create a basic filter if the filter argument is blank
        if (filter === undefined || filter == null || filter.where === undefined || filter.where == null) {
            filter = { where: { caseID: caseID } };
        }
        return await this.casePatientProgressRepository.find(filter);
    }
    async update(companyID, caseID, casePatientProgress) {
        // Ensure that the provided CasePatientProgress has a caseID that matches the path caseID
        if (casePatientProgress.caseID != caseID) {
            throw new rest_1.HttpErrors.BadRequest("CasePatientProgress.caseID does not match the URL path caseID");
        }
        // Check if this Case already has a CasePatientProgress
        let recordCount = await this.casePatientProgressRepository.count({ caseID: caseID });
        // Create or Update the CasePatientProgress based on whether it exists already
        if (recordCount.count == 0) {
            let savedProgress = await this.casePatientProgressRepository.create(casePatientProgress);
            return true;
        }
        else {
            let updatedProgresses = await this.casePatientProgressRepository.updateAll(casePatientProgress, { caseID: caseID });
            return (updatedProgresses.count == 1);
        }
    }
};
__decorate([
    rest_1.post('/companies/{companyID}/cases/{caseID}/patientProgress', {
        responses: {
            '200': {
                description: 'CasePatientProgress model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CasePatientProgress } } },
            },
        },
    }),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CasePatientProgress]),
    __metadata("design:returntype", Promise)
], CasePatientProgressesController.prototype, "create", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/patientProgress', {
        responses: {
            '200': {
                description: 'Array of CasePatientProgress model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CasePatientProgress } },
                    },
                },
            },
        },
    }),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CasePatientProgress))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CasePatientProgressesController.prototype, "find", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}/patientProgress', {
        responses: {
            '200': {
                description: 'CasePatientProgress PATCH success count',
                content: { 'application/json': { schema: repository_1.CountSchema } },
            },
        },
    }),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CasePatientProgress]),
    __metadata("design:returntype", Promise)
], CasePatientProgressesController.prototype, "update", null);
CasePatientProgressesController = __decorate([
    __param(0, repository_1.repository(repositories_1.CasePatientProgressRepository)),
    __metadata("design:paramtypes", [repositories_1.CasePatientProgressRepository])
], CasePatientProgressesController);
exports.CasePatientProgressesController = CasePatientProgressesController;
//# sourceMappingURL=case-patient-progresses-controller.controller.js.map