import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as config from './couchdb.datasource.json';

export class CouchdbDataSource extends juggler.DataSource {
  static dataSourceName = 'couchdb';

  constructor(
    @inject('datasources.config.couchdb', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
