import { 
  Component, 
  ElementRef,
  forwardRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild, 
  ChangeDetectionStrategy, 
  ViewEncapsulation,
  SimpleChanges} from '@angular/core';
import { 
  ControlValueAccessor, 
  FormControl, 
  Validator,
  ValidationErrors,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { AngularFileUploaderComponent } from 'angular-file-uploader';
import { ToastController, LoadingController } from '@ionic/angular';
import { EscortDocument } from '../../apiClient';

import { environment } from '../../../environments/environment';

const COUNTER_CONTROL_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SkycareFileUploaderComponent),
  multi: true
};

const VALIDATOR = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => SkycareFileUploaderComponent),
    multi: true
};


@Component({
  selector: 'skycare-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  providers: [ VALIDATOR, COUNTER_CONTROL_ACCESSOR ]
})
export class SkycareFileUploaderComponent implements OnInit, ControlValueAccessor, Validator {

  public loading : any = null;

  @Input() filename: string = '';
  @Input() type: string = '';
  @Input() setOnce : boolean = false;
  @Input() required : boolean = false;
  @Input() uploaded : boolean = false;
  @Input() escortID : string = '';
  @Input() caseID : string = '';
  @Input() documentID : string = '';
  @Output() onFileSelected: EventEmitter<any> = new EventEmitter();
  @Output() onFileRemoved: EventEmitter<any> = new EventEmitter();
  @Output() onFileUploadRequested: EventEmitter<any> = new EventEmitter();
  @Output() onFileUploaded: EventEmitter<any> = new EventEmitter();
  @Output() onFileViewRequested: EventEmitter<any> = new EventEmitter();

  // ELEMENT REF
  @ViewChild('fileUploaderControl') fileUploaderControl: AngularFileUploaderComponent;

  // CONTROL VALUE ACCESSOR FUNCTIONS
  onTouch: Function;
  onModelChange: Function;
  value: string = '';

  // COMPONENT PROPERTIES
  selectedFile : string = '';
  originalUploadFilesHandler : any = null;
  imageWasScaled : boolean = false;
  scaledImage : string = '';



  public SKYCARE_FILE_UPLOAD_CONFIG : any = {};

  constructor(private authService : AuthService,
              private toaster : ToastController,
              private loadingController : LoadingController,
              private domAccessor : ElementRef) { }



  ngOnInit() {
    let originalChangeHandler : any = this.fileUploaderControl.onChange;
    this.fileUploaderControl.onChange = (evt:Event) => {
      if ((evt.target as HTMLInputElement).files.length > 0) {
        let file : File = (evt.target as HTMLInputElement).files[0];
        let selectedFileName : string = file.name;

        this.attemptToResizeSelectedImage(file).then(success=>{return;});

        this.selectedFile = selectedFileName;
        this.onFileSelected.emit(selectedFileName);
        this.updateValue();

        this.setButtons(false, true, true, true);
      }
      originalChangeHandler.call(this.fileUploaderControl, evt);
    };

    this.originalUploadFilesHandler = this.fileUploaderControl.uploadFiles;
    this.fileUploaderControl.uploadFiles = () => {
      this.onFileUploadRequested.emit({ filename: this.value, control: this });
    };

    let originalResetFileUpload : any = this.fileUploaderControl.resetFileUpload;
    this.fileUploaderControl.resetFileUpload = () => {
      this.selectedFile = '';
      this.uploaded = false;
      this.onFileRemoved.emit();
      this.updateValue();
      originalResetFileUpload.call(this.fileUploaderControl);

      this.setButtons(true, false, false, false);
    }

    let uploadURL : string = environment.fileUploadURL;
    uploadURL += (this.type == 'escort') ? 'escorts/' : (this.type == 'escortReceipt') ? 'escortReceipts/' : 'cases/';

    this.SKYCARE_FILE_UPLOAD_CONFIG = {
      multiple: false,
      maxSize: 20,
      uploadAPI:  {
        url:  uploadURL,
        headers: {
          "Authorization" : `Bearer ${this.authService.getJWT()}`
        }
      }
    };

    // Only the browse button should be enabled by default
    this.setButtons(true, false, false, false);
  }


  resetUploadFiles() : void {
    this.scaledImage = '';
    this.imageWasScaled = false;
    this.fileUploaderControl.resetFileUpload();
  }


  async finishUploadFiles(ownerID : string, documentID : string) : Promise<void> {
    this.documentID = documentID;    

    this.loading = await this.loadingController.create({
      message: 'Encrypting File...this may take a minute'
    });
    await this.loading.present();

    let uploadURL : string = environment.fileUploadURL;
    switch (this.type) {
      case 'escort':
        this.escortID = ownerID;
        uploadURL += 'escorts/' + this.escortID + '/documents/';
        break;
      case 'escortReceipt':
        this.caseID = ownerID;;
        uploadURL += 'companies/UNKNOWN/cases/' + this.caseID + '/escortReceipts/';
        break;
      case 'case':
        this.caseID = ownerID;
        uploadURL += 'companies/UNKNOWN/cases/' + this.caseID + '/documents/';
        break;
    }
    uploadURL += this.documentID + '/file'

    this.SKYCARE_FILE_UPLOAD_CONFIG = {
      multiple: false,
      maxSize: 20,
      uploadAPI:  {
        url:  uploadURL,
        headers: {
          "Authorization" : `Bearer ${this.authService.getJWT()}`
        }
      }
    };

    if (this.imageWasScaled) {
      this.uploadDataURL(this.SKYCARE_FILE_UPLOAD_CONFIG);
    } else {
      this.fileUploaderControl.config = this.SKYCARE_FILE_UPLOAD_CONFIG;
      this.fileUploaderControl.ngOnChanges({ config : this.SKYCARE_FILE_UPLOAD_CONFIG } as SimpleChanges)
  
      // Execute the original uploadFiles handler
      this.originalUploadFilesHandler.call(this.fileUploaderControl);
    }
  }



  registerOnTouched(fn: Function) { this.onTouch = fn; }
  registerOnChange(fn: Function) { this.onModelChange = fn; }




  writeValue(filename: string) {
    if (filename == null || filename == undefined || filename.trim() == '') {
      this.selectedFile = '';
    } else {
      // This file is being set onload, so we will assume it was uploaded
      this.selectedFile = filename;
      this.fileUploaderControl.selectedFiles = [{
        lastModified : Date.now(),
        lastModifiedDate : new Date(),
        name : filename,
        size : 100,
        type : '',
        webkitRelativePath : ''}];
      this.uploaded = true;
      this.updateValue();

      if (this.setOnce) {
        this.setButtons(false, true, false, false);
      } else {
        this.setButtons(true, false, false, false);
      }

      this.setFileViewHandler();
    }
  }


  updateValue() {
    this.value = this.selectedFile;
    this.onModelChange(this.value);
    this.onTouch();
  }


  
  validate(c: FormControl): ValidationErrors | null {
    let value = c.value;
    if (this.required && !value) { return { "required": true }; }
    if (value && !this.uploaded) { return { "not-uploaded" : true }; }
    return null;
  }




  async documentUploaded(req : XMLHttpRequest) : Promise<void> {

    await this.loading.dismiss();

    switch (req.status) {
      case 200:
        let uploadResponse : EscortDocument = JSON.parse(req.response) as EscortDocument;
        this.uploaded = true;
                
        this.onFileUploaded.emit(uploadResponse);
        this.onModelChange(this.value);
        this.onTouch();

        if (this.setOnce) {
          this.setButtons(false, true, false, false);
          this.setFileViewHandler();
        } else {
          this.setButtons(true, false, false, false);
        }
        break;
      case 0:
      case 500:
      default:
        const toast = await this.toaster.create({ message: 'ERROR: Failed to upload the file. Contact Support', showCloseButton: true });
        toast.present();
        console.log(req);
        break;
    }
  }


  showUploadedDocument(evt : MouseEvent) : void {
    evt.preventDefault();
    this.onFileViewRequested.emit(this.filename);
  }

  setButtons(showBrowse : boolean, showRemove : boolean, showUpload : boolean, enableUpload : boolean = true) : void {
    this.fileUploaderControl.hideSelectBtn = !showBrowse;
    this.fileUploaderControl.hideResetBtn = !showRemove;
    this.fileUploaderControl.uploadBtn = enableUpload;

    setTimeout(() => {
      let browseButton : any = this.domAccessor.nativeElement.querySelector('label.afu-select-btn');
      let resetButton : any = this.domAccessor.nativeElement.querySelector('button.afu-reset-btn');
      let uploadButton : any = this.domAccessor.nativeElement.querySelector('button.afu-upload-btn');

      if (uploadButton != null) {
        uploadButton.style.display = (showUpload) ? 'block' : 'none';
      }

      if (resetButton != null) {
        resetButton.textContent = 'Remove';
        resetButton.style.display = (showRemove) ? 'block' : 'none';
        resetButton.style.right = (showRemove && showUpload) ? '80px' : '0px';
      }

      if (browseButton != null) {
        browseButton.textContent = 'Browse';
        browseButton.style.display = (showBrowse) ? 'block' : 'none';
        browseButton.style.right = (showBrowse) ? ((showRemove) ? ((showUpload) ? '153px' : '73px') : ((showUpload) ? '80px' : '0px')) : '153px';
      }
    }, 250);
  }

  setFileViewHandler() : void {
    // Crazy hack to add a click handler to the filename after Angular has had a chance to render changes
    setTimeout((()=>{
      // Search for the filenameContainer using a specific CSS path selector
      let filenameContainer : any = this.domAccessor.nativeElement.querySelector('div.afu-valid-file p.textOverflow span.text-primary');

      // Add an eventlistener for "click" that will call "showUploadedDocument"
      filenameContainer.addEventListener('click', this.showUploadedDocument.bind(this));
    }).bind(this), 1000);
  }



  async attemptToResizeSelectedImage(file: File): Promise<void> {
    let MAX_WIDTH : number = environment.maxUploadImageWidth;
    let MAX_HEIGHT : number = environment.maxUploadImageHeight;
    let ORIG_WIDTH : number = 0;
    let ORIG_HEIGHT : number = 0;
    let CUR_WIDTH : number = 0;
    let CUR_HEIGHT : number = 0;

    // Only images can be resized
    let allowedImageTypes : string[] = ['image/bmp', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/tiff', 'image/webp'];
    if (allowedImageTypes.indexOf(file.type) == -1) { return; }

    // Lets see how big this image is in its natural form
    let img = document.createElement("img");
    img.src = await new Promise<any>(resolve => {
      let reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
    await new Promise(resolve => img.onload = resolve)
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ORIG_WIDTH = CUR_WIDTH = img.naturalWidth;
    ORIG_HEIGHT = CUR_HEIGHT = img.naturalHeight;

    // If this image is too large, lets scale it
    if (ORIG_WIDTH > MAX_WIDTH || ORIG_HEIGHT > MAX_HEIGHT) {      
      if (CUR_WIDTH > CUR_HEIGHT) {
        if (CUR_WIDTH > MAX_WIDTH) {
          CUR_HEIGHT *= MAX_WIDTH / CUR_WIDTH;
          CUR_WIDTH = MAX_WIDTH;
        }
      } else {
        if (CUR_HEIGHT > MAX_HEIGHT) {
          CUR_WIDTH *= MAX_HEIGHT / CUR_HEIGHT;
          CUR_HEIGHT = MAX_HEIGHT;
        }
      }
      canvas.width = CUR_WIDTH;
      canvas.height = CUR_HEIGHT;
      ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, CUR_WIDTH, CUR_HEIGHT);

      // Convert the scaled image to a data URL
      this.scaledImage = await new Promise<string>(resolve => { resolve(canvas.toDataURL('image/jpeg')); });
      this.imageWasScaled = true;
    }
  }


  // TODO : SWITCH THIS TO USE THE FetchAPI
  uploadDataURL(config : any) : void {    
    let isError = false;
      
    let formData = new FormData();
    formData.append('file0', this.scaledImage);    
    
    let xhr = new XMLHttpRequest();  
    xhr.onload = evnt => {};
    xhr.onreadystatechange = evnt => {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) { isError = true; }
            this.documentUploaded(xhr);
        }
    };
    
    xhr.open("POST", config.uploadAPI.url, true);
    for (const key of Object.keys(config.uploadAPI.headers)) {
        xhr.setRequestHeader(key, config.uploadAPI.headers[key]);
    }
    //xhr.setRequestHeader('Authorization', 'Bearer '+this.authService.getJWT());
    xhr.send(formData);
  }

}

