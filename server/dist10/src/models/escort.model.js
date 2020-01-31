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
const _1 = require(".");
let GPSPoint = class GPSPoint extends repository_1.ValueObject {
};
__decorate([
    repository_1.property({ type: 'number', required: true }),
    __metadata("design:type", Number)
], GPSPoint.prototype, "latitude", void 0);
__decorate([
    repository_1.property({ type: 'number', required: true }),
    __metadata("design:type", Number)
], GPSPoint.prototype, "longitude", void 0);
GPSPoint = __decorate([
    repository_1.model()
], GPSPoint);
exports.GPSPoint = GPSPoint;
let Escort = class Escort extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
__decorate([
    repository_1.property({ type: 'string', id: true, required: true }),
    __metadata("design:type", String)
], Escort.prototype, "escortID", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], Escort.prototype, "name", void 0);
__decorate([
    repository_1.property({ type: 'string', required: true }),
    __metadata("design:type", String)
], Escort.prototype, "userID", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "licenseType", void 0);
__decorate([
    repository_1.property({ type: 'date' }),
    __metadata("design:type", String)
], Escort.prototype, "licenseExpiration", void 0);
__decorate([
    repository_1.property({ type: 'date' }),
    __metadata("design:type", String)
], Escort.prototype, "alsExpiration", void 0);
__decorate([
    repository_1.property({ type: 'date' }),
    __metadata("design:type", String)
], Escort.prototype, "passportExpiration", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "passportCountry", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "visaCountry1", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "visaCountry2", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "visaCountry3", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "language1", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "language2", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "language3", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "language4", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "homeAirportCity", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "emergencyContactName", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "emergencyContactPhone", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "emergencyContactRelation", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "availability", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentAccountName", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankName", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankAddress1", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankAddress2", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankCity", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankRegion", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankCountry", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentBankPostalCode", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentUSRoutingNumber", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentIntlRoutingNumber", void 0);
__decorate([
    repository_1.property({ type: 'string' }),
    __metadata("design:type", String)
], Escort.prototype, "paymentAccountNumber", void 0);
__decorate([
    repository_1.property({ type: 'object' }),
    __metadata("design:type", _1.User)
], Escort.prototype, "user", void 0);
Escort = __decorate([
    repository_1.model(),
    __metadata("design:paramtypes", [Object])
], Escort);
exports.Escort = Escort;
//# sourceMappingURL=escort.model.js.map