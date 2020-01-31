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
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = require("@loopback/repository");
const case_patient_assessment_model_1 = require("./case-patient-assessment.model");
const case_patient_progress_model_1 = require("./case-patient-progress.model");
let CaseEscort = class CaseEscort extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseEscort.prototype, "escortID", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CaseEscort.prototype, "name", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CaseEscort.prototype, "email", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CaseEscort.prototype, "paid", void 0);
CaseEscort = __decorate([
    repository_1.model()
], CaseEscort);
exports.CaseEscort = CaseEscort;
let EscortLocation = class EscortLocation extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], EscortLocation.prototype, "escortID", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], EscortLocation.prototype, "date", void 0);
__decorate([
    repository_1.property({ type: 'number', required: true }),
    __metadata("design:type", Number)
], EscortLocation.prototype, "latitude", void 0);
__decorate([
    repository_1.property({ type: 'number', required: true }),
    __metadata("design:type", Number)
], EscortLocation.prototype, "longitude", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], EscortLocation.prototype, "stage", void 0);
EscortLocation = __decorate([
    repository_1.model()
], EscortLocation);
exports.EscortLocation = EscortLocation;
let CaseStatusChange = class CaseStatusChange extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseStatusChange.prototype, "oldStatus", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseStatusChange.prototype, "newStatus", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], CaseStatusChange.prototype, "date", void 0);
CaseStatusChange = __decorate([
    repository_1.model()
], CaseStatusChange);
exports.CaseStatusChange = CaseStatusChange;
let CaseTransportConsent = class CaseTransportConsent extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "signature", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "signersName", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "signatureDate", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "signersRelationshipToPatient", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "patientDOB", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "patientName", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "fromLocation", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseTransportConsent.prototype, "toLocation", void 0);
CaseTransportConsent = __decorate([
    repository_1.model()
], CaseTransportConsent);
exports.CaseTransportConsent = CaseTransportConsent;
let CompanyCase = class CompanyCase extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
__decorate([
    repository_1.property({ type: 'string', required: true, id: true }),
    __metadata("design:type", String)
], CompanyCase.prototype, "caseID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CompanyCase.prototype, "companyID", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "companyName", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CompanyCase.prototype, "caseNumber", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CompanyCase.prototype, "currentStatus", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "patientFirstName", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "patientLastName", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "diagnosis", void 0);
__decorate([
    repository_1.property({ type: 'date' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "firstDayOfTravel", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CompanyCase.prototype, "numberTravelDays", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "originCity", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "destinationCity", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CompanyCase.prototype, "quotedPrice", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CompanyCase.prototype, "invoiceSent", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CompanyCase.prototype, "invoicePaid", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "flightNumber1", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "connectionCity1", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "flightNumber2", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "connectionCity2", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "flightNumber3", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CompanyCase.prototype, "payPerDay", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "externalAccessEmail1", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "externalAccessEmail2", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CompanyCase.prototype, "externalAccessEmail3", void 0);
__decorate([
    repository_1.property({ type: 'object' }),
    __metadata("design:type", CaseTransportConsent)
], CompanyCase.prototype, "patientConsent", void 0);
__decorate([
    repository_1.property({ type: 'object' }),
    __metadata("design:type", case_patient_assessment_model_1.CasePatientAssessment)
], CompanyCase.prototype, "patientAssessment", void 0);
__decorate([
    repository_1.property({ type: 'object' }),
    __metadata("design:type", case_patient_progress_model_1.CasePatientProgress)
], CompanyCase.prototype, "patientProgress", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CompanyCase.prototype, "escorts", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CompanyCase.prototype, "escortTracking", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CompanyCase.prototype, "escortReceipts", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CompanyCase.prototype, "statusChanges", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CompanyCase.prototype, "documents", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CompanyCase.prototype, "messages", void 0);
CompanyCase = __decorate([
    repository_1.model(),
    __metadata("design:paramtypes", [Object])
], CompanyCase);
exports.CompanyCase = CompanyCase;
//# sourceMappingURL=company-case.model.js.map