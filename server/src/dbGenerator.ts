import {DataSource, Repository, DefaultCrudRepository} from '@loopback/repository';
import {ServerApplication} from './index';
import {UserRepository, LoginAttemptRepository} from './repositories';
import {CaseDocumentRepository} from './repositories';
import {CaseEscortReceiptRepository} from './repositories';
import {CaseMessageRepository} from './repositories';
import {CasePatientAssessmentRepository} from './repositories';
import {CasePatientProgressRepository} from './repositories';
import {CompanyCaseRepository} from './repositories';
import {CompanyUserRepository} from './repositories';
import {CompanyRepository} from './repositories';
import {EscortDocumentRepository} from './repositories';
import {EscortRepository} from './repositories';
import {AppFeedbackRepository} from './repositories';
import { User, Escort, Company, CompanyUser } from './models';


export async function createDB(app: ServerApplication) {

  const ds = await app.get<DataSource>('datasources.cloudant');

  let counter : number = 0;

  let repoList : any[] = [  { repo: UserRepository, model: 'User' },
                            { repo: CaseDocumentRepository, model: 'CaseDocument' },
                            { repo: CaseEscortReceiptRepository, model: 'CaseEscortReceipt' },
                            { repo: CaseMessageRepository, model: 'CaseMessage' },
                            { repo: AppFeedbackRepository, model: 'AppFeedback' },
                            { repo: CasePatientAssessmentRepository, model: 'CasePatientAssessment' },
                            { repo: CasePatientProgressRepository, model: 'CasePatientProgress' },
                            { repo: CompanyCaseRepository, model: 'CompanyCase' },
                            { repo: CompanyUserRepository, model: 'CompanyUser' },
                            { repo: CompanyRepository, model: 'Company' },
                            { repo: EscortDocumentRepository, model: 'EscortDocument' },
                            { repo: EscortRepository, model: 'Escort' },
                            { repo: LoginAttemptRepository, model: 'LoginAttempt' }
                          ];

  // Loop through each Repository in the list and schedule loading and generating it
  for (let i = 0; i < repoList.length; i++) {
    setTimeout(() => finishCreatingDB(app, ds, repoList[i].repo, repoList[i].model), (i+1) * 5000);
  }
  counter += repoList.length;

  // Generate the default Users
  let allUsers : User[] = [{
        userID: 'super-admin',
        name: 'Super Admin',
        password: 'test',
        email: 'a@b.c',
        key2FA: 'empty',
        phoneNumber: '17276923653',
        role: 'admin',
        emailVerified: true
      },{
        userID: 'chris-admin',
        name: 'Chris Williams',
        password: 'testtest',
        email: 'chris.williams@puremoneysystems.com',
        key2FA: 'empty',
        phoneNumber: '17276923653',
        role: 'admin',
        emailVerified: true
      },{
        userID: 'mo-admin',
        name: 'Mo Williams',
        password: 'testtest',
        email: 'osoth01@gmail.com',
        key2FA: 'empty',
        phoneNumber: '18134641080',
        role: 'admin',
        emailVerified: true
      },{
        userID: 'dan-admin',
        name: 'Dan Thompson',
        password: 'testtest',
        email: 'medicusinvestmentgroup@gmail.com',
        key2FA: 'empty',
        phoneNumber: '15185734201',
        role: 'admin',
        emailVerified: true
      },{
        userID: 'steve-admin',
        name: 'Steve Avise',
        password: 'testtest',
        email: 'ops@skycareglobal.com',
        key2FA: 'empty',
        phoneNumber: '17274229454',
        role: 'admin',
        emailVerified: true
      },{
        userID: 'mattia-admin',
        name: 'Mattia Cherubin',
        password: 'testtest',
        email: 'mattia.cherubin@skycareglobal.com',
        key2FA: 'empty',
        phoneNumber: "15185734201",
        role: 'admin',
        emailVerified: true
      },{
        userID: 'chris-escort',
        name: 'Chris Williams (Escort)',
        password: 'testtest',
        email: 'chris@blockspaces.io',
        key2FA: 'empty',
        phoneNumber: '17274229454',
        role: 'escort',
        emailVerified: true
      },{
        userID: 'chris-company',
        name: 'Chris Williams (Company)',
        password: 'testtest',
        email: 'chris.williams@logiclabs.us',
        key2FA: 'empty',
        phoneNumber: '17274229454',
        role: 'client',
        emailVerified: true
      }
  ] as User[];

  // Start timers for creating each User
  for(let j = 0; j < allUsers.length; j++){
    setTimeout(async () => {
      const userRepository = await app.getRepository(UserRepository);
      userRepository.create(allUsers[j]);
    }, ((counter) + j) * 5000);
  }
  counter += allUsers.length;

  // Generate the default Escorts
  let escorts : Escort[] = [{
    userID: 'chris-escort',
    escortID: 'chris-escort-id',
    name: 'Chris Williams (Escort)'
  }] as Escort[];

  // Start timers for creating each Escort
  for(let k = 0; k < escorts.length; k++){
    setTimeout(async () => {
      const escortRepository = await app.getRepository(EscortRepository);
      escortRepository.create(escorts[k]);
    }, ((counter) + k) * 5000);
  }
  counter += escorts.length;

  // Generate the default Company
  let companies : Company[] = [{
    companyID: 'aig',
    name: 'AIG',
    emailForInvoices: 'test@aig.com'
  }] as Company[];

  // Start timers for creating each Company
  for(let m = 0; m < companies.length; m++){
    setTimeout(async () => {
      const companyRepository = await app.getRepository(CompanyRepository);
      companyRepository.create(companies[m]);
    }, ((counter) + m) * 5000);
  }
  counter += companies.length;

  // Generate the default CompanyUsers
  let companyUsers : CompanyUser[] = [{
    companyID: 'aig',
    userID: 'chris-company',
    companyUserID: 'chris-company-aig',
    lastLogin: (new Date()).toISOString()
  }] as CompanyUser[];

  // Start timers for creating each CompanyUser
  for(let n = 0; n < companyUsers.length; n++){
    setTimeout(async () => {
      const companyUserRepository = await app.getRepository(CompanyUserRepository);
      companyUserRepository.create(companyUsers[n]);
    }, ((counter) + n) * 5000);
  }
  counter += companyUsers.length;

}

export async function finishCreatingDB(app: ServerApplication, ds: DataSource, repository: any, modelName: string) {
  const currentRepository = await app.getRepository(repository);

  try {
    await ds.automigrate(modelName);
  } catch (err){
    console.log('GOT AN ERROR');
    console.log(err);
  }
}

export async function updateDB(app: ServerApplication) {
 const ds = await app.get<DataSource>('datasources.cloudant');
 const userRepo = await app.getRepository(UserRepository);
 const caseDocRepo = await app.getRepository(CaseDocumentRepository);
 const caseEscortRecRepo = await app.getRepository(CaseEscortReceiptRepository);
 const caseMessageRepo = await app.getRepository(CaseMessageRepository);
 const appFeedbackRepo = await app.getRepository(AppFeedbackRepository);
 const casePatientAssessmentRepo = await app.getRepository(CasePatientAssessmentRepository);
 const casePatientProgressRepo = await app.getRepository(CasePatientProgressRepository);
 const companyCaseRepo = await app.getRepository(CompanyCaseRepository);
 const compnayUserRepo = await app.getRepository(CompanyUserRepository);
 const companyRepo = await app.getRepository(CompanyRepository);
 const escortDocRepo= await app.getRepository(EscortDocumentRepository);
 const escortRepo = await app.getRepository(EscortRepository);

 await ds.autoupdate();
}