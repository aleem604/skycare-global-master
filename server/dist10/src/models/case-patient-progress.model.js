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
let VitalSignsStatus = class VitalSignsStatus extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "userID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "bloodPressure", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "heartRate", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "respiratoryRate", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "temperature", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "bloodSugar", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "oxygenSaturation", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "oxygenFlowRate", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "measurementMode", void 0);
__decorate([
    repository_1.property({ type: 'number', required: true }),
    __metadata("design:type", Number)
], VitalSignsStatus.prototype, "painMeasurement", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], VitalSignsStatus.prototype, "date", void 0);
VitalSignsStatus = __decorate([
    repository_1.model()
], VitalSignsStatus);
exports.VitalSignsStatus = VitalSignsStatus;
let DeliveredMedications = class DeliveredMedications extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], DeliveredMedications.prototype, "description", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], DeliveredMedications.prototype, "dose", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], DeliveredMedications.prototype, "route", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], DeliveredMedications.prototype, "userID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], DeliveredMedications.prototype, "patientResponse", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], DeliveredMedications.prototype, "date", void 0);
DeliveredMedications = __decorate([
    repository_1.model()
], DeliveredMedications);
exports.DeliveredMedications = DeliveredMedications;
let ProgressNote = class ProgressNote extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], ProgressNote.prototype, "userID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], ProgressNote.prototype, "text", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], ProgressNote.prototype, "date", void 0);
ProgressNote = __decorate([
    repository_1.model()
], ProgressNote);
exports.ProgressNote = ProgressNote;
let CasePatientProgress = class CasePatientProgress extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
__decorate([
    repository_1.property({ type: 'string', required: true, id: true }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "patientProgressID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "caseID", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "escort1ID", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "escort1Signature", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "escort2ID", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "escort2Signature", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "medicalProviderName", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "medicalProviderSignature", void 0);
__decorate([
    repository_1.property({ type: 'date' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "medicalProviderSignatureDate", void 0);
__decorate([
    repository_1.property({ type: 'boolean', required: true, default: false }),
    __metadata("design:type", Boolean)
], CasePatientProgress.prototype, "patientBelongings", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientProgress.prototype, "patientBelongingsDesc", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CasePatientProgress.prototype, "statusUpdates", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CasePatientProgress.prototype, "medications", void 0);
__decorate([
    repository_1.property.array(Object),
    __metadata("design:type", Array)
], CasePatientProgress.prototype, "notes", void 0);
CasePatientProgress = __decorate([
    repository_1.model(),
    __metadata("design:paramtypes", [Object])
], CasePatientProgress);
exports.CasePatientProgress = CasePatientProgress;
//# sourceMappingURL=case-patient-progress.model.js.map