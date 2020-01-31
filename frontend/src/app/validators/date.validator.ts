import { FormControl, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';

export class DateValidator {
    
    static isAfterYesterday = (isRequired : boolean) : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            if (abstractControl.value == '' && isRequired) {
                return { 'not-after-yesterday': true };
            } else {
                try {
                    let yesterday : number = Date.now() - (24 * 60 * 60 * 1000);
                    let parsedDate : number = Date.parse(abstractControl.value);

                    if (parsedDate <= yesterday) {
                        return { 'not-after-yesterday': true };
                    } else {
                        return null;
                    }
                } catch (err) {
                    return { 'not-after-yesterday': true };
                }
            }
        };
    }

    static isAfterToday = (isRequired : boolean) : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            if (abstractControl.value == '' && isRequired) {
                return { 'not-after-today': true };
            } else {
                try {
                    let today : number = Date.now();
                    let parsedDate : number = Date.parse(abstractControl.value);

                    if (parsedDate <= today) {
                        return { 'not-after-today': true };
                    } else {
                        return null;
                    }
                } catch (err) {
                    return { 'not-after-today': true };
                }
            }
        };
    }

    static isBeforeToday = (isRequired : boolean) : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            if (abstractControl.value == '' && isRequired) {
                return { 'not-before-today': true };
            } else {
                try {
                    let today : number = Date.now();
                    let parsedDate : number = Date.parse(abstractControl.value); 

                    if (parsedDate >= today) {
                        return { 'not-before-today': true };
                    } else {
                        return null;
                    }
                } catch (err) {
                    return { 'not-before-today': true };
                }
            }
        };
    }
    
}