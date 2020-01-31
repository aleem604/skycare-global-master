import {Entity, model, property} from '@loopback/repository';

@model()
export class CredentialReset extends Entity {

  @property({
    type: 'string',
    id: true,
    required: false,
  })
  credentialResetID?: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: false,
  })
  newEmail?: string;

  @property({
    type: 'string',
    required: false,
  })
  newPassword?: string;

  @property({
    type: 'string',
    required: false,
  })
  newPhoneNumber?: string;

  @property({
    type: 'string',
    required: false,
  })
  userID?: string;

  @property({
    type: 'string',
    required: false,
    defautl: Date.now().toString()
  })
  timestamp?: string;

  constructor(data?: Partial<CredentialReset>) {
    super(data);
  }
}
