import { Entity } from '@loopback/repository';
export declare class CaseMessage extends Entity {
    messageID: string;
    caseID: string;
    senderID: string;
    sendDate: string;
    message: string;
    constructor(data?: Partial<CaseMessage>);
}
