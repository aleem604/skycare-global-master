import {Entity, model, property} from '@loopback/repository';

@model()
export class LoginAttempt extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  loginAttemptID: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  loginDate: string;

  constructor(data?: Partial<LoginAttempt>) {
    super(data);
  }
}
