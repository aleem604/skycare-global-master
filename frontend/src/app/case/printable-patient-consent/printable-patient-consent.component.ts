import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase } from '../../apiClient';
import { ModalController, NavParams, ToastController } from '@ionic/angular';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { CaseService } from '../case.service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-printable-patient-consent',
  templateUrl: './printable-patient-consent.component.html',
  styleUrls: ['./printable-patient-consent.component.scss']
})
export class PrintablePatientConsentComponent implements OnInit {

  public caseID : string = '';
  public signatureReady : boolean = false;

  public currentCase : CompanyCase = {
    patientConsent : {
      fromLocation : '',
      toLocation : '',
      patientDOB : '',
      patientName : '',
      signature : '',
      signatureDate : '',
      signersName : '',
      signersRelationshipToPatient : ''
    },
    caseID : '',
    caseNumber : '',
    companyID : '',
    currentStatus : '',
    escorts : [],
    escortReceipts : [],
    statusChanges : [],
    documents : [],
    messages : []
  };


  constructor(private modalController: ModalController,
              private toaster: ToastController,
              private caseService: CaseService,
              private route: ActivatedRoute,
              private domAccessor : ElementRef) { }

  ngOnInit() {
    // Check for an authenticated view with a caseID
    this.route.url.subscribe(
      (segments : UrlSegment[]) => {
        if (segments.findIndex( (value,index,list)=>{ return (value.path == 'printConsent'); }) > -1) {
          this.route.paramMap.subscribe( async (params) => {
            this.caseID = params.get('caseID');

            (await this.caseService.getCase('UNKNOWN', this.caseID)).subscribe(
              (retrievedCases:any[]) => {
                if (retrievedCases.length == 0) { return; }        
                this.currentCase = (retrievedCases[0]) as CompanyCase;
              },
              catchError( async (err:any) => {
                const toast = await this.toaster.create({
                  message: 'Could not find a Case with the specified CaseID',
                  showCloseButton: true       
                })
                toast.present();
              })
            );
          });
        }
      }
    )
  }



  checkIfReadyToPrint(currentImage : string) : void {
    console.log(currentImage + ' is ready...');

    if (currentImage == 'signature') {   
      this.preparePageForPrint();
    }
  }


  preparePageForPrint() : void {
    let outlet : any = this.domAccessor.nativeElement.parentElement;
    let originalStyles : string = outlet.shadowRoot.textContent;

    let containStartIndex : number = originalStyles.indexOf('contain');
    let containEndIndex : number = originalStyles.indexOf(';', containStartIndex) + 1;
    let osPrefix : string = originalStyles.substr(0, containStartIndex);
    let osSuffix : string = originalStyles.substr(containEndIndex);
    console.log(osPrefix);
    console.log(osSuffix);

    outlet.shadowRoot.firstChild.innerHTML = osPrefix + osSuffix;

    setTimeout( ()=>{ window.print(); }, 3000);
  }

}
