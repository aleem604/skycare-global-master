import { Entity } from '@loopback/repository';
export declare class CaseDocument extends Entity {
    documentID: string;
    caseID: string;
    type: string;
    name: string;
    createDate: string;
    storageHash?: string;
    modifyDate?: string;
    constructor(data?: Partial<CaseDocument>);
}
