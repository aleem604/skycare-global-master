import { FormControl, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';

export class PasswordValidator {
    
    static areEqual = (passwordControlName: string) : ValidatorFn => {
        return (confirmPasswordControl: AbstractControl): {[key: string]: boolean} => {
            if (confirmPasswordControl.parent == undefined) { return null; }
            let passwordValue : string = confirmPasswordControl.parent.controls[passwordControlName].value;
            
            if(confirmPasswordControl.value !== ""){
                if(confirmPasswordControl.value == passwordValue){
                    return null;
                }
                return { areEqual: true };
            } else{
              return null;
            }
        };
    }
}