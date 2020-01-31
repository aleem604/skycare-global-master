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
let CasePatientAssessment = class CasePatientAssessment extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
__decorate([
    repository_1.property({ type: 'string', required: true, id: true }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "patientAssessmentID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "caseID", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "airwayUsingO2", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "airwayPatientO2LPM", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "airwayUsingBVM", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "airwayUsingETT", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "airwayUsingETTSize", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "airwayUsingETTRate", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "airwayUsingOPANPA", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "airwayUsingTrach", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "airwayUsingTrachSize", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "airwayNotes", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "respBreathing", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "respTracheaMidline", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "respCough", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "respCoughProductive", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "respChestWallExpansion", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "respChestTrauma", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "respBreathSounds", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "respBreathDiminishedRight", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "respBreathDiminishedLeft", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "respMonitors", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "respSupplimentaryO2Device", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "respEquipLPM", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "respEquipPercent", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "cardiacRate", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "cardiacRhythm", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "cardiacSounds", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "cardiacJvd", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "cardiacPeripheralEdemaLocation", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "cardiacPeripheralEdemaScore", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "cardiacExternalPacing", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "cardiacExternalPacingMA", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "cardiacExternalPacingRate", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "cardiacEcgFindings", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "cardiacNotes", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "cardiacEquipment", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "abdomenCondition", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "abdomenTenderness", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "abdomenBowelSounds", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "abdomenFeedTube", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "abdomenFeedTubeSize", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "abdomenFeedTubeState", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "abdomenNotes", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "pelvisStable", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "pelvisFoley", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "pelvisFoleySize", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "pelvisAppearanceOfUrine", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "pelvisNotes", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "painDenies", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "painLocation", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "painSensation", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "painScale", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "backTrauma", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "backNotes", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "extremitiesTrauma", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "extremitiesPulsesRUE", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "extremitiesPulsesLUE", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "extremitiesPulsesRLE", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "extremitiesPulsesLLE", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "demeanorSpeech", void 0);
__decorate([
    repository_1.property.array(String),
    __metadata("design:type", Array)
], CasePatientAssessment.prototype, "demeanorSkin", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "demeanorBehavior", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "neuroEyes", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "neuroVerbal", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "neuroMotor", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "neuroGcsScore", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "neuroHeentTrauma", void 0);
__decorate([
    repository_1.property({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], CasePatientAssessment.prototype, "neuroPupilsPERRLA", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "neuroSizeLeft", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "neuroSizeRight", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "neuroReactionLeft", void 0);
__decorate([
    repository_1.property({ type: 'number' }),
    __metadata("design:type", Number)
], CasePatientAssessment.prototype, "neuroReactionRight", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "neuroNotes", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "diagramAnnotations", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "diagramNotes", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CasePatientAssessment.prototype, "overallSignature", void 0);
CasePatientAssessment = __decorate([
    repository_1.model(),
    __metadata("design:paramtypes", [Object])
], CasePatientAssessment);
exports.CasePatientAssessment = CasePatientAssessment;
//# sourceMappingURL=case-patient-assessment.model.js.map