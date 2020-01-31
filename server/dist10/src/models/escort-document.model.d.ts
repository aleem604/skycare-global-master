import { Entity } from '@loopback/repository';
export declare class EscortDocument extends Entity {
    documentID: string;
    escortID: string;
    type: string;
    name: string;
    createDate: string;
    storageHash?: string;
    modifyDate?: string;
    constructor(data?: Partial<EscortDocument>);
}
