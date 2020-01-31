import { Entity } from '@loopback/repository';
export declare class CaseEscortReceipt extends Entity {
    receiptID: string;
    caseID: string;
    escortID: string;
    name: string;
    createDate: string;
    alternateName?: string;
    storageHash?: string;
    currencyType?: string;
    amount?: number;
    receiptDate?: string;
    usdAmount?: number;
    constructor(data?: Partial<CaseEscortReceipt>);
}
