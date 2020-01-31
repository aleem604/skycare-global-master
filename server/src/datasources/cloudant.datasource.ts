import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';

// @ts-ignore
import * as config from './cloudant.datasource.json';

export class CloudantDataSource extends juggler.DataSource {
  static dataSourceName = 'cloudant';

  constructor(
    @inject('datasources.config.cloudant', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
