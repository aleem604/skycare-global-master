import { FormControl, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';
import { SkycareFileUploaderComponent } from '../controls/file-uploader/file-uploader.component';


export class FileUploadedValidator {
    
    static hasBeenUploaded = () : ValidatorFn => {
        return (fileUploaderControl: AbstractControl): {[key: string]: boolean} | null => {
            if (fileUploaderControl instanceof SkycareFileUploaderComponent) {
                if ((<SkycareFileUploaderComponent>fileUploaderControl).uploaded) {
                    return null;
                } else {
                    return { 'not-uploaded': true };
                }
            } else {
                return null;
            }
        };
    }


    static uploadedAtLeastOneFile = (fileListRetriever : any) : ValidatorFn => {
        return (fileUploaderControl: AbstractControl): {[key: string]: boolean} | null => {
            let fileList : string[] = fileListRetriever();
            return (fileList.length == 0) ? { 'no-uploads': true } : null;
        };
    }
    
}