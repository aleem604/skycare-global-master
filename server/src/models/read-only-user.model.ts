import {Entity, model, property} from '@loopback/repository';

@model()
export class ReadOnlyUser extends Entity {

  @property({
    type: 'string',
    id: true,
    required: true,
  })
  externalAccessID: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  caseID: string;

  constructor(data?: Partial<ReadOnlyUser>) {
    super(data);
  }
}
