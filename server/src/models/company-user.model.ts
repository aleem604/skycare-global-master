import {Entity, model, property} from '@loopback/repository';
import { User, Company } from '.';

@model()
export class CompanyUser extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  companyUserID: string;

  @property({
    type: 'string',
    required: true,
  })
  companyID: string;

  @property({
    type: 'string',
    required: true,
  })
  userID: string;

  @property({
    type: 'date',
    required: true,
    default: Date.now().toString(),
  })
  lastLogin: string;


  @property({ type: 'object' })                                               user? : User;
  @property({ type: 'object' })                                               company? : Company;

  constructor(data?: Partial<CompanyUser>) {
    super(data);
  }
}
