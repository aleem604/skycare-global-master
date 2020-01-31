import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { async } from '@angular/core/testing';
import { AuthService } from '../auth.service';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public email : string = '';
  public password : string = '';
  public rememberMe : boolean = false;

  public buttonDisabled : boolean = false;
  public loginAttempts : any = {};

  public loginUserForm: FormGroup;
  public validationMessages : any = {
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'email', message: 'Provided email is not valid' },
      { type: 'emailTaken', message: 'Provided email is already taken' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 8 characters long.' }
    ]
  }
  
  constructor(private authService:AuthService,
              private router:Router, 
              private toastController:ToastController, 
              private loader: LoadingController,
              private alertCtrl: AlertController,
              private formBuilder: FormBuilder) {
    this.loginUserForm = formBuilder.group({
          emailControl: new FormControl('', Validators.compose([
                                                  Validators.required,
                                                  Validators.email
                                            ])
                                      ),
          passwordControl: new FormControl('', Validators.compose([
                                                  Validators.required,
                                            ])
                                      ),
          rememberMeControl: new FormControl('')
    });           

    this.loginUserForm.statusChanges.subscribe(
      (observer:any) => {
        this.buttonDisabled = this.loginUserForm.invalid;
      }
    )
  }                


  ngOnInit() {
    if (this.authService.isAuthenticated() && this.authService.getRole() !== '' && this.authService.getRole() !== 'limited') {
      setTimeout(()=>{
        this.router.navigate(["/dashboard", this.authService.getRole()])
      }, 1000);
    }
  }

  async login(){
    if (this.loginAttempts[this.email] && this.loginAttempts[this.email] >= 5) {
      const toast = await this.toastController.create({ message: 'Account locked. Reset your password.', showCloseButton: true });
      toast.present();
      return;
    }

    const loginLoader = await this.loader.create({
      message: 'Logging you in...'
    });
    await loginLoader.present();

    this.authService.login(this.email, this.password, this.rememberMe).subscribe(
      async (loginResponse:any) => {
        await loginLoader.dismiss();
        if (loginResponse.success) {
          // Check if we are supposed to login with 2FA
          if (loginResponse.using2FA) {
            this.router.navigate(["/auth", "login2FA"]);
          } else {
            (await this.authService.loadProfile()).subscribe(async (profile: any) => { 
              const toast = await this.toastController.create({
                message: 'Successfully logged in!',
                duration: 2000
              });
              toast.present();
              this.router.navigate(["/dashboard", this.authService.getRole()]);
            });
          }
        } else {
          let countOfFailedLoginsForEmail : number = this.trackFailedLogin(this.email);
          let message : string = (countOfFailedLoginsForEmail >= 5) ? 'Account locked. Too many failed logins' : 'Bad username or password';
          const toast = await this.toastController.create({ message: message, showCloseButton: true });
          toast.present();
        }
      },
      async (err) => {
        await loginLoader.dismiss();
        let message : string = '';
        if (err.unauthorized){          
          let countOfFailedLoginsForEmail : number = this.trackFailedLogin(this.email);
          message = (countOfFailedLoginsForEmail >= 5) ? 'Account locked. Too many failed logins' : 'Bad username or password';
        } else {
          message = 'Server Error, please contact Tech Support';
        }
        const toast = await this.toastController.create({ message: message, showCloseButton: true });
        toast.present();
      }
    );
  }

  trackFailedLogin(email : string) : number {
    let returnCount : number = 1;
    if (this.loginAttempts[email]) {
      returnCount = ++this.loginAttempts[email];
    }
    this.loginAttempts[email] = returnCount;
    return returnCount;
  }

  async passwordReset(){
    let alert = await this.alertCtrl.create({
      header: 'Password Reset',
      inputs: [
        {
          name: 'email',
          placeholder: 'Email'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => { console.log('Cancel clicked'); }
        },
        {
          text: 'Reset',
          handler: data => {
            this.authService.resetPassword(data.email).subscribe(
              async (success:boolean) => {
                if (success) {
                  const toast = await this.toastController.create({
                    message: 'A password reset link has been sent to your email.',
                    showCloseButton: true       
                  })
                  toast.present();
                } else {
                  const toast = await this.toastController.create({
                    message: 'An error occured while creating the password reset link.',
                    showCloseButton: true       
                  })
                  toast.present();
                }
              }
            )
          }
        }
      ]
    });
    alert.present();
  }  
}
