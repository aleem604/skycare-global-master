import { FormControl, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';

export class BankRoutingValidator {
    
    static validABA = (routingTypeChooserControlName : string = '') : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            let isRequired : boolean = false;

            if (routingTypeChooserControlName != '') {
                if (abstractControl.parent == undefined) { return null; }
                let routingTypeChoice : string = abstractControl.parent.controls[routingTypeChooserControlName].value;
                isRequired = (routingTypeChoice == 'aba');
            }

            if (abstractControl.value == '') {
                return ((isRequired) ? { 'invalid-aba': true } : null);
            } else {
                try {
                    let abaNumber : string = abstractControl.value;
                    let ABA_IS_VALID : boolean = BankRoutingValidator.isValidABA(abaNumber);
                    return ((ABA_IS_VALID) ? null : { 'invalid-aba': true });
                } catch (err) {
                    return { 'invalid-aba': true };
                }
            }
        };
    }
    static isValidABA = (ABA_VALUE : string) : boolean => {
        let digestOutput : number = 0;
        for (let i = 0; i < ABA_VALUE.length; i += 3) {
            digestOutput += parseInt(ABA_VALUE.charAt(i),     10) * 3
                        +  parseInt(ABA_VALUE.charAt(i + 1), 10) * 7
                        +  parseInt(ABA_VALUE.charAt(i + 2), 10);
        }

        // If the resulting sum is an even multiple of ten (but not zero), the aba routing number is good.
        return (digestOutput != 0 && digestOutput % 10 == 0);
    }



    static validIBAN = (routingTypeChooserControlName : string = '') : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            let isRequired : boolean = false;

            if (routingTypeChooserControlName != '') {
                if (abstractControl.parent == undefined) { return null; }
                let routingTypeChoice : string = abstractControl.parent.controls[routingTypeChooserControlName].value;
                isRequired = (routingTypeChoice == 'iban');
            }

            if (abstractControl.value == '') {
                return ((isRequired) ? { 'invalid-iban': true } : null);
            } else {
                try {
                    let ibanNumber : string = abstractControl.value;
                    let IBAN_IS_VALID : boolean = BankRoutingValidator.isValidIBAN(ibanNumber);
                    return ((IBAN_IS_VALID) ? null : { 'invalid-iban': true });
                } catch (err) {
                    return { 'invalid-iban': true };
                }
            }
        };
    }
    static isValidIBAN = (IBAN_VALUE : string) : boolean => {
        let CODE_LENGTHS = {
            AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
            CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
            FI: 18, FO: 18, FR: 27, GB: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
            HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
            LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27,
            MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
            RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26
        };
        let ibanParsed = String(IBAN_VALUE).toUpperCase().replace(/[^A-Z0-9]/g, ''), // keep only alphanumeric characters
            code : any = ibanParsed.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
            digits : string = '';

        // check syntax and length
        if (!code || ibanParsed.length !== CODE_LENGTHS[code[1]]) {
            return false;
        }

        // rearrange country code and check digits, and convert chars to ints
        digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, (letter) => { return (letter.charCodeAt(0) - 55).toString(); });

        // final check
        let checksum : number = parseInt(digits.slice(0, 2)), 
            fragment : string = '';
        for (let offset = 2; offset < digits.length; offset += 7) {
            fragment = String(checksum) + digits.substring(offset, offset + 7);
            checksum = parseInt(fragment, 10) % 97;
        }

        return (checksum == 1);
    }



    static validBIC = (routingTypeChooserControlName : string = '') : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            let isRequired : boolean = false;

            if (routingTypeChooserControlName != '') {
                if (abstractControl.parent == undefined) { return null; }
                let routingTypeChoice : string = abstractControl.parent.controls[routingTypeChooserControlName].value;
                isRequired = (routingTypeChoice == 'bic');
            }

            if (abstractControl.value == '') {
                return ((isRequired) ? { 'invalid-bic': true } : null);
            } else {
                try {
                    let bicNumber : string = abstractControl.value;
                    let BIC_IS_VALID : boolean = BankRoutingValidator.isValidBIC(bicNumber);
                    return ((BIC_IS_VALID) ? null : { 'invalid-bic': true });
                } catch (err) {
                    return { 'invalid-bic': true };
                }
            }
        };
    }
    static isValidBIC = (BIC_VALUE : string) : boolean => {
        return /^([A-Z]{6}[A-Z2-9][A-NP-Z1-9])(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?$/.test( BIC_VALUE.toUpperCase() );
    }


    static validSWIFT = (routingTypeChooserControlName : string = '') : ValidatorFn => {
        return (abstractControl: AbstractControl): {[key: string]: boolean} | null => {
            let isRequired : boolean = false;

            if (routingTypeChooserControlName != '') {
                if (abstractControl.parent == undefined) { return null; }
                let routingTypeChoice : string = abstractControl.parent.controls[routingTypeChooserControlName].value;
                isRequired = (routingTypeChoice == 'swift');
            }

            if (abstractControl.value == '') {
                return ((isRequired) ? { 'invalid-swift': true } : null);
            } else {
                try {
                    let swiftNumber : string = abstractControl.value;
                    let SWIFT_IS_VALID : boolean = BankRoutingValidator.isValidSWIFT(swiftNumber);
                    return ((SWIFT_IS_VALID) ? null : { 'invalid-swift': true });
                } catch (err) {
                    return { 'invalid-swift': true };
                }
            }
        };
    }
    static isValidSWIFT = (SWIFT_VALUE : string) : boolean => {
        return /[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?/i.test( SWIFT_VALUE.toUpperCase() );
    }
    
    
}