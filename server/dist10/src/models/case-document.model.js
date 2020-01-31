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
let CaseDocument = class CaseDocument extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
__decorate([
    repository_1.property({ type: 'string', required: true, id: true }),
    __metadata("design:type", String)
], CaseDocument.prototype, "documentID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseDocument.prototype, "caseID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseDocument.prototype, "type", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], CaseDocument.prototype, "name", void 0);
__decorate([
    repository_1.property({ type: 'date', required: true }),
    __metadata("design:type", String)
], CaseDocument.prototype, "createDate", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], CaseDocument.prototype, "storageHash", void 0);
__decorate([
    repository_1.property({ type: 'date' }),
    __metadata("design:type", String)
], CaseDocument.prototype, "modifyDate", void 0);
CaseDocument = __decorate([
    repository_1.model(),
    __metadata("design:paramtypes", [Object])
], CaseDocument);
exports.CaseDocument = CaseDocument;
//# sourceMappingURL=case-document.model.js.map