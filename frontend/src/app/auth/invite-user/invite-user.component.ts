import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { async } from '@angular/core/testing';
import { ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { EmailTakenValidator } from 'src/app/validators/emailTaken.validator';

@Component({
  selector: 'app-invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.scss']
})
export class InviteUserComponent implements OnInit {

  public userType : string = '';
  public userName : string = '';
  public userEmail : string = '';  
  public buttonDisabled : boolean = false;  
  public phoneNumber : string = '';
  public companyName : string = '';


  public inviteUserForm: FormGroup;
  public validationMessages : any = {
    'email': [
      { type: 'required', message: 'Email is required' },
      { type: 'pattern', message: 'Provided email is not valid' },
      { type: 'emailTaken', message: 'Provided email is already taken' }
    ],
    'userType': [
      { type: 'required', message: 'Please select a user type' },
    ],
    'name': [
      { type: 'required', message: 'Name is required' },
    ],
    'phone': [
      { type: 'required', message: 'Phone number is required' },
      { type: 'pattern', message: 'Phone number is not valid' },
      { type: 'minlength', message: 'Phone number is not valid' },
      { type: 'maxlength', message: 'Phone number is too long' },
    ],
  }

  constructor(private authService: AuthService,
              private toastController: ToastController, 
              private loading : LoadingController,
              private router: Router,
              private formBuilder: FormBuilder,
              private emailValidator: EmailTakenValidator) {

    this.inviteUserForm = formBuilder.group({
          emailControl: new FormControl('', {
                validators: Validators.compose([
                                Validators.required,
                                Validators.email,
                                Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
                            ]),
                asyncValidators: [ emailValidator.emailTaken.bind(emailValidator, null) ],
                updateOn: 'blur'}),
          userTypeControl: new FormControl('', Validators.required),
          nameControl: new FormControl('', Validators.required),
          companyNameControl: new FormControl(''),
          phoneControl: new FormControl('', Validators.compose([
                                Validators.required,                             
                                Validators.maxLength(16),
                                Validators.pattern('^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$')
          ]))
        });

    this.inviteUserForm.statusChanges.subscribe(
      (observer:any) => {
        this.buttonDisabled = this.inviteUserForm.invalid;
      }
    );
  }

  ngOnInit() {
  }

  async inviteUser(){
    this.buttonDisabled = true;
    
    let loader = await this.loading.create({
      message: 'Inviting User...'
    });
    await loader.present();

    this.authService.inviteUser(this.userType, this.userName, this.userEmail, this.phoneNumber, this.companyName).subscribe(
      async (success:boolean) => { 
        if (success){
          const toast = await this.toastController.create({
            message: 'Successfully invited user',
            duration: 2000
          });
          await toast.present();
        } else{
          const toast = await this.toastController.create({
            message: 'Error occurred while inviting user',
            showCloseButton: true
          });
          await toast.present(); 
        }
        await loader.dismiss();
        this.buttonDisabled = false;
      },
      async (err)=>{
        console.log(err);
        const toast = await this.toastController.create({
          message: 'Error occurred while inviting user',
          showCloseButton: true
        });
        await toast.present(); 
        await loader.dismiss();
        this.buttonDisabled = false;
      }
    );
  }
}
