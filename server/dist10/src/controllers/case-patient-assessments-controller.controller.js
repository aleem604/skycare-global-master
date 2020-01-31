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
let CasePatientAssessmentsController = class CasePatientAssessmentsController {
    constructor(casePatientAssessmentRepository) {
        this.casePatientAssessmentRepository = casePatientAssessmentRepository;
    }
    async create(companyID, caseID, casePatientAssessment) {
        // Ensure that the provided CasePatientAssessment has a caseID that matches the path caseID
        if (casePatientAssessment.caseID != caseID) {
            throw new rest_1.HttpErrors.BadRequest("CasePatientAssessment.caseID does not match the URL path caseID");
        }
        // Make sure that now other CasePatientAssessment records exist for this caseID
        let recordCount = await this.casePatientAssessmentRepository.count({ caseID: caseID });
        if (recordCount.count > 0) {
            throw new rest_1.HttpErrors.BadRequest("A CasePatientAssessment record already exists for a Case with caseID : " + caseID);
        }
        // Create the CasePatientAssessment
        return await this.casePatientAssessmentRepository.create(casePatientAssessment);
    }
    async find(companyID, caseID, filter) {
        // Create a basic filter if the filter argument is blank
        if (filter === undefined || filter == null || filter.where === undefined || filter.where == null) {
            filter = { where: { caseID: caseID } };
        }
        return await this.casePatientAssessmentRepository.find(filter);
    }
    async updateAll(companyID, caseID, casePatientAssessment) {
        // Ensure that the provided CasePatientAssessment has a caseID that matches the path caseID
        if (casePatientAssessment.caseID != caseID) {
            throw new rest_1.HttpErrors.BadRequest("CasePatientAssessment.caseID does not match the URL path caseID");
        }
        // Check if this Case already has a CasePatientAssessment
        let recordCount = await this.casePatientAssessmentRepository.count({ caseID: caseID });
        // Create or Update the CasePatientAssessment based on whether it exists already
        if (recordCount.count == 0) {
            let savedAssessment = await this.casePatientAssessmentRepository.create(casePatientAssessment);
            return true;
        }
        else {
            let updatedAsssesments = await this.casePatientAssessmentRepository.updateAll(casePatientAssessment, { caseID: caseID });
            return (updatedAsssesments.count == 1);
        }
    }
};
__decorate([
    rest_1.post('/companies/{companyID}/cases/{caseID}/patientAssessment', {
        responses: {
            '200': {
                description: 'CasePatientAssessment model instance',
                content: { 'application/json': { schema: { 'x-ts-type': models_1.CasePatientAssessment } } },
            },
        },
    }),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CasePatientAssessment]),
    __metadata("design:returntype", Promise)
], CasePatientAssessmentsController.prototype, "create", null);
__decorate([
    rest_1.get('/companies/{companyID}/cases/{caseID}/patientAssessment', {
        responses: {
            '200': {
                description: 'Array of CasePatientAssessment model instances',
                content: {
                    'application/json': {
                        schema: { type: 'array', items: { 'x-ts-type': models_1.CasePatientAssessment } },
                    },
                },
            },
        },
    }),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.param.query.object('filter', rest_1.getFilterSchemaFor(models_1.CasePatientAssessment))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CasePatientAssessmentsController.prototype, "find", null);
__decorate([
    rest_1.patch('/companies/{companyID}/cases/{caseID}/patientAssessment', {
        responses: {
            '200': {
                description: 'CasePatientAssessment PATCH success count',
                content: { 'application/json': { schema: repository_1.CountSchema } },
            },
        },
    }),
    __param(0, rest_1.param.path.string('companyID')),
    __param(1, rest_1.param.path.string('caseID')),
    __param(2, rest_1.requestBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, models_1.CasePatientAssessment]),
    __metadata("design:returntype", Promise)
], CasePatientAssessmentsController.prototype, "updateAll", null);
CasePatientAssessmentsController = __decorate([
    __param(0, repository_1.repository(repositories_1.CasePatientAssessmentRepository)),
    __metadata("design:paramtypes", [repositories_1.CasePatientAssessmentRepository])
], CasePatientAssessmentsController);
exports.CasePatientAssessmentsController = CasePatientAssessmentsController;
//# sourceMappingURL=case-patient-assessments-controller.controller.js.map