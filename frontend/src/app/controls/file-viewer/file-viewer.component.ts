import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalController, LoadingController, ToastController, NavParams } from '@ionic/angular';
import { EscortDocument, CaseDocument, CaseEscortReceipt } from '../../apiClient';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentsService } from '../../documents/documents.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

declare const window : any;

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss']
})
export class SkycareFileViewerComponent implements OnInit {

  document: EscortDocument | CaseDocument | CaseEscortReceipt;
  archivedCase: boolean;
  frameSource : any = '';
  documentName : string = '';
  fileData : any;
  fileURL : string = '';
  downloadURL : any = '';
  public loading : any = null;

  constructor(private navParams : NavParams,
              private modalController : ModalController,
              private docsService : DocumentsService,
              private toaster : ToastController,
              private loadingController : LoadingController,
              private sanitizer: DomSanitizer) { 

    this.frameSource = sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    this.document = navParams.data.document;
    this.archivedCase = navParams.data.archivedCase;
  }

  ngOnInit() {
    this.displayFile();
  }

  instanceOfCaseEscortReceipt(doc : EscortDocument | CaseDocument | CaseEscortReceipt) : doc is CaseEscortReceipt { return 'receiptID' in doc; }
  instanceOfEscortDocument(doc : EscortDocument | CaseDocument | CaseEscortReceipt) : doc is EscortDocument { return 'escortID' in doc; }
  instanceOfCaseDocument(doc : EscortDocument | CaseDocument | CaseEscortReceipt) : doc is CaseDocument { return 'caseID' in doc; }

  downloadFile() : void {
    this.downloadURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileURL);
    console.log(this.fileData);
    console.log(this.downloadURL);
  }

  async displayFile() : Promise<void> {

    this.loading = await this.loadingController.create({
      message: 'Decrypting File...this may take a minute'
    });
    await this.loading.present();

    this.documentName = this.document.name;

    if (this.instanceOfCaseEscortReceipt(this.document)) {
      // Retrieve the escortReceipt from the server
      (await this.docsService.getCaseEscortReceiptFile(this.document.caseID, this.document.receiptID, this.archivedCase)).subscribe(
        async (escortReceiptFiles : any) => {
          if (escortReceiptFiles.length == 0) { throw new Error('ERROR: No files were retrieved for the requested CaseEscortReceipt.'); }

          //Create fileURL from blob object
          this.fileData = escortReceiptFiles[0].filedata;
          this.fileURL = window.URL.createObjectURL(this.fileData);

          //Bind trustedURL to frame source
          this.frameSource = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileURL); 

          await this.loading.dismiss();
        },
        catchError( async (err) => {
          await this.loading.dismiss();
          const toast = await this.toaster.create({ message: 'ERROR: Failed to retrieve the file. Contact Support', showCloseButton: true });
          toast.present();
          return throwError(err);
        })
      );
    } else {
      if (this.instanceOfEscortDocument(this.document)) {
        // Retrieve the document from the server
        this.docsService.getEscortDocumentFile(this.document.escortID, this.document.documentID).subscribe(
          async (retrievedFileData : Blob) => {
            //Create fileURL from blob object
            this.fileData = retrievedFileData;
            this.fileURL = window.URL.createObjectURL(this.fileData);

            //Bind trustedURL to frame source
            this.frameSource = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileURL); 

            await this.loading.dismiss();
          },
          catchError( async (err) => {
            await this.loading.dismiss();
            const toast = await this.toaster.create({ message: 'ERROR: Failed to retrieve the file. Contact Support', showCloseButton: true });
            toast.present();
            return throwError(err);
          })
        );
      } else {
        // Retrieve the document from the server
        (await this.docsService.getCaseDocumentFile(this.document.caseID, this.document.documentID, this.archivedCase)).subscribe(
          async (caseDocumentFiles : any) => {
            if (caseDocumentFiles.length == 0) { throw new Error('ERROR: No files were retrieved for the requested CaseDocument.'); }

            //Create fileURL from blob object
            this.fileData = caseDocumentFiles[0].filedata;
            this.fileURL = window.URL.createObjectURL(this.fileData);

            //Bind trustedURL to frame source
            this.frameSource = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileURL); 

            await this.loading.dismiss();
          },
          catchError( async (err) => {
            await this.loading.dismiss();
            const toast = await this.toaster.create({ message: 'ERROR: Failed to retrieve the file. Contact Support', showCloseButton: true });
            toast.present();
            return throwError(err);
          })
        );
      }      
    }
  }

  closeFile() : void { 
    window.URL.revokeObjectURL(this.frameSource);
    this.modalController.dismiss({'result':''}); 
  }

}
