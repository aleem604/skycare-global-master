import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Company, CompanyUser, User } from '../../apiClient';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss']
})
export class ClientProfileComponent implements OnInit {

  public clientProfile : CompanyUser = {
    userID: '',
    companyID: '',
    companyUserID: '',
    lastLogin: new Date(),
    user: {} as User,
    company: {
      name: '',
      emailForInvoices: ''
    } as Company
  } as CompanyUser;

  
  public buttonDisabled: boolean = true;

  public companyProfileForm: FormGroup;
  public validationMessages : any = {
    'billingEmail': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Provided email is not valid.' },
      { type: 'emailTaken', message: 'Provided email is already taken.' }
    ],
    'name': [
      {type: 'required', message: 'Company Name is required.'}
    ],
    'notificationEmail1': [
      { type: 'pattern', message: 'Provided email is not valid.' }
    ],
    'notificationEmail2': [
      { type: 'pattern', message: 'Provided email is not valid.' }
    ],
    'notificationEmail3': [
      { type: 'pattern', message: 'Provided email is not valid.' }
    ]
  }

  constructor(private authService: AuthService,
              private toastController: ToastController, 
              private router: Router,
              private route: ActivatedRoute,
              private alertCtrl: AlertController,
              private formBuilder: FormBuilder,) { 

  }

  async ngOnInit() {

    if (this.authService.currentProfile != null) {
      this.clientProfile = this.authService.currentProfile;
    } else {        
      (await this.authService.loadProfile()).subscribe( (profile: any) => { this.clientProfile = profile; });
    }

    this.companyProfileForm = this.formBuilder.group({
      billingEmailControl: new FormControl('', Validators.compose([
                        Validators.required,
                        Validators.email,
                        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
                    ])),
      notificationEmail1Control: new FormControl('', Validators.compose([
                        Validators.email,
                        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
                    ])),
      notificationEmail2Control: new FormControl('', Validators.compose([
                        Validators.email,
                        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
                    ])),
      notificationEmail3Control: new FormControl('', Validators.compose([
                        Validators.email,
                        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
                    ])),
      nameControl: new FormControl('', Validators.compose([ Validators.required ])),
    });
        
    this.companyProfileForm.statusChanges.subscribe(
      (observer:any) => {
        this.buttonDisabled = this.companyProfileForm.invalid;
      }
    );
  }

  async updateAccount(){
    this.buttonDisabled = true;
    
    // Ask the AuthService to update the User's email and password
    this.authService.saveProfile(this.clientProfile).subscribe(
      async (success:boolean) => { 
        if (success){
          const toast = await this.toastController.create({
            message: 'Successfully updated profile',
            duration: 2000
          });
          toast.present();
        } else {
          const toast = await this.toastController.create({
            message: 'Failed to update your profile',
            duration: 2000
          });
          toast.present(); 
        }
        this.buttonDisabled = false;
      }
    );
  }
  
}


