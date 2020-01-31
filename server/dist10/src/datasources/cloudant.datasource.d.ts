import { juggler } from '@loopback/repository';
export declare class CloudantDataSource extends juggler.DataSource {
    static dataSourceName: string;
    constructor(dsConfig?: object);
}
