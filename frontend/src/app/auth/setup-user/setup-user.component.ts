import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { PasswordValidator } from '../../validators/password.validator';
import { EmailTakenValidator } from '../../validators/emailTaken.validator';

@Component({
  selector: 'app-setup-user',
  templateUrl: './setup-user.component.html',
  styleUrls: ['./setup-user.component.scss']
})
export class SetupUserComponent implements OnInit {
  public email : string = '';
  public resetID : string = '';
  public password : string = '';  
  public confirmPassword : string = ''; 
  public phoneNumber : string = '';
  public buttonDisabled: boolean = true;

  public setupUserForm: FormGroup;
  public validationMessages : any = {
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Provided email is not valid' },
      { type: 'emailTaken', message: 'Provided email is already taken' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 8 characters long.' }
    ],
    'confirmPassword': [
      { type: 'required', message: 'Password confirmation is required.' },
      { type: 'minlength', message: 'Password must be at least 8 characters long.' },
      { type: 'areEqual', message: 'Passwords do not match' }
    ],
    'phone': [
      { type: 'required', message: 'Phone number is required' },
      { type: 'pattern', message: 'Phone number is not valid' },
      { type: 'maxlength', message: 'Phone number is too long' },
    ]
  }

  constructor(private authService: AuthService,
              private toastController: ToastController, 
              private router: Router,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private emailValidator: EmailTakenValidator) { 

  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.resetID = params.get('resetID');

      this.setupUserForm = this.formBuilder.group({
        emailControl: new FormControl('', {
              validators: Validators.compose([
                              Validators.required,
                              Validators.email,
                              Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
                          ]),
              asyncValidators: [ this.emailValidator.emailTaken.bind(this.emailValidator, this.resetID) ],
              updateOn: 'blur'}),
        passwordControl: new FormControl('', Validators.compose([
                              Validators.required,
                              Validators.minLength(8)
                          ])),
        confirmPasswordControl: new FormControl('', Validators.compose([
                              Validators.required,
                              Validators.minLength(8),
                              PasswordValidator.areEqual('passwordControl')
                          ])),
        phoneControl: new FormControl('', Validators.compose([
                              Validators.required,                              
                              Validators.maxLength(16),
                              Validators.pattern('^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$')
        ]))
      });
          
      this.setupUserForm.statusChanges.subscribe(
        (observer:any) => {
          this.buttonDisabled = this.setupUserForm.invalid;
        }
      );

      // Verify that the setupUser link is still valid
      this.authService.checkResetID(this.resetID).subscribe(
        async (isValid : boolean) => {
          if (!isValid) {
            const toast = await this.toastController.create({
              message: 'Setup link has expired.  Please click Reset Password',
              showCloseButton: true
            });
            toast.present();

            this.router.navigate(["/auth", "login"]);
          }
        }
      )
    });
  }

  async updateAccount(){
    this.buttonDisabled = true;
    
    // Ask the AuthService to update the User's email and password
    this.authService.updateCredentials(this.resetID, this.confirmPassword, this.email, this.phoneNumber.toString()).subscribe(
      async (success:boolean) => { 
        if (success){
          const toast = await this.toastController.create({
            message: 'Successfully updated account',
            duration: 2000
          });
          toast.present();

          if (this.authService.getUsing2FA()) {
            this.router.navigate(["/auth", "login2FA"]);
          } else {
            this.router.navigate(["/dashboard", this.authService.getRole()]);
          }
        } else {
          const toast = await this.toastController.create({
            message: 'Failed to update your account',
            duration: 2000
          });
          toast.present(); 
        }
        this.buttonDisabled = false;
      }
    );
  }
}
