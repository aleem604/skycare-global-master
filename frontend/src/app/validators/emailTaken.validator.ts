import { FormControl, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable()
export class EmailTakenValidator {

    constructor(public authservice: AuthService) {
    }

    emailTaken(resetID: string|undefined|null, control: FormControl): any {

        return new Promise(resolve => {
            
            this.authservice.emailAddressAvailable(control.value, resetID).subscribe(
                (addressAvalible: string) => {
                    if (addressAvalible == 'AVAILABLE') {
                        resolve(null);
                    } else if (addressAvalible == 'NOT_AVAILABLE' || addressAvalible == 'ACCESS_DENIED'){
                        resolve({ "emailTaken": true });
                    }
                }
            );

        });
    }

}