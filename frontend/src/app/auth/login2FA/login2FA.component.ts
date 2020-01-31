import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login2fa',
  templateUrl: './login2FA.component.html',
  styleUrls: ['./login2FA.component.scss']
})
export class Login2FAComponent implements OnInit {

  public pinCode: string = '';
  public loginButtonDisabled: boolean = true;
  public resendPINButtondisabled: boolean = false;

  public login2FAUserForm: FormGroup;
  public validationMessages : any = {
    'pinCode': [
      { type: 'required', message: 'PIN Code is required.' },
      { type: 'minlength', message: 'PIN Code must be 4 digits' },
      { type: 'pattern', message: 'PIN Code must be all numbers' },

    ]
  }

  constructor(private formBuilder: FormBuilder,
              private authService: AuthService,
              private router: Router,
              private toastController: ToastController) {

    this.login2FAUserForm = formBuilder.group({
      pinCodeControl: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(4),
        Validators.pattern('^[0-9]*$')
      ]))
    });

    this.login2FAUserForm.statusChanges.subscribe(
      (observer:any) => {
        this.loginButtonDisabled = this.login2FAUserForm.invalid;
      }
    );
  }

  ngOnInit() {
  }

  sendNewPINCode() : void {
    this.resendPINButtondisabled = true;
    this.authService.sendNew2FAPINCode().subscribe(
      async (new2FASuccess:string) => {
        if (new2FASuccess == 'SUCCESS') {
          const toast = await this.toastController.create({ message: 'New PIN Code sent to your phone', showCloseButton: true });
          toast.present();
        } else {
          let message : string = '';
          switch(new2FASuccess) {
            case 'WAIT':
            case 'TRY_AGAIN':
            case 'RECREATE_PIN':
              message = 'The network is congested.  Try again in 5 minutes';
              break;
            case 'DIFFERENT_PHONE':
              message = 'Black-listed phone number.  Reset your password and phone number';
              break;
            case 'ERROR':
            default:
              message = 'Application error.  Contact Tech Support';
              break;
          }
          const toast = await this.toastController.create({ message: message, showCloseButton: true });
          toast.present();
        }
        this.resendPINButtondisabled = false;
      }
    );
  }

  finishLogin() : void {
    this.loginButtonDisabled = true;
    this.authService.login2FA(this.pinCode).subscribe(
      async (login2FASuccess:string) => {
        if (login2FASuccess == 'SUCCESS') {
          const toast = await this.toastController.create({ message: 'Successfully logged in!', duration: 2000 });
          toast.present();

          // Redirect in 2 seconds, after everything has finished loading
          setTimeout(() => {
            this.router.navigate(["/dashboard", this.authService.getRole()]);
          }, 2000);
        } else {
          let message : string = '';
          switch(login2FASuccess) {
            case 'WAIT':
              message = 'The network is congested.  Try again in 5 minutes';
              break;
            case 'DIFFERENT_PHONE':
              message = 'Black-listed phone number.  Reset your password and phone number';
              break;
            case 'TRY_AGAIN':
              message = 'Incorrect PIN Code.  Please verify and try again';
              break;
            case 'RECREATE_PIN':
              message = 'PIN has expired. Request a new PIN Code';
              break;
            case 'ERROR':
            default:
              message = 'Application error.  Contact Tech Support';
              break;
          }
          const toast = await this.toastController.create({ message: message, showCloseButton: true });
          toast.present();
          this.loginButtonDisabled = false;
        }
      }
    );
  }

}
