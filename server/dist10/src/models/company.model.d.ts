import { Entity } from '@loopback/repository';
export declare class Company extends Entity {
    companyID: string;
    name: string;
    emailForInvoices: string;
    emailForUpdates1?: string;
    emailForUpdates2?: string;
    emailForUpdates3?: string;
    constructor(data?: Partial<Company>);
}
