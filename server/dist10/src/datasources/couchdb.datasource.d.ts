import { juggler } from '@loopback/repository';
export declare class CouchdbDataSource extends juggler.DataSource {
    static dataSourceName: string;
    constructor(dsConfig?: object);
}
