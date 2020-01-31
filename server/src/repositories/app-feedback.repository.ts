import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {AppFeedback} from '../models';
import {CloudantDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class AppFeedbackRepository extends DefaultCrudRepository<
  AppFeedback,
  typeof AppFeedback.prototype.feedbackID
> {
  constructor(
    @inject('datasources.cloudant') dataSource: CloudantDataSource,
  ) {
    super(AppFeedback, dataSource);
  }
}
