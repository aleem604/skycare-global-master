import {Entity, model, property, ValueObject} from '@loopback/repository';

@model()
export class User extends Entity {

  @property({ type: 'string', id: true, required: true })             userID: string;

  @property({ type: 'string', required: true })                       name: string;
  @property({ type: 'string', required: true })                       email: string;
  @property({ type: 'string', required: true })                       password: string;
  @property({ type: 'string', required: true })                       phoneNumber: string;
  @property({ type: 'string', required: true })                       role: string;

  @property({ type: 'string', required: false })                      key2FA?: string;
  @property({ type: 'boolean', default: false })                      emailVerified?: boolean;
  @property({ type: 'string', required: false })                      companyName?: string;


  constructor(data?: Partial<User>) {
    super(data);
  }
}



@model()
export class UserDeletes extends ValueObject {

  @property.array(String)                           userIDs : string[];

}