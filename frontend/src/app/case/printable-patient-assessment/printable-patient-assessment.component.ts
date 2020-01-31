import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase } from '../../apiClient';
import { ModalController, NavParams, ToastController } from '@ionic/angular';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { CaseService } from '../case.service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-printable-patient-assessment',
  templateUrl: './printable-patient-assessment.component.html',
  styleUrls: ['./printable-patient-assessment.component.scss']
})
export class PrintablePatientAssessmentComponent implements OnInit {

  public caseID : string = '';
  public diagramsReady : boolean = false;
  public signatureReady : boolean = false;


  public currentCase : CompanyCase = {
    patientAssessment : {
      patientAssessmentID: '',
      caseID: '',
      respBreathing : [],
      cardiacEquipment : [],
      abdomenCondition : [],
      abdomenTenderness : [],
      painSensation : [],
      backTrauma : [],
      extremitiesTrauma : [],
      demeanorSkin : [],      
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
        if (segments.findIndex( (value,index,list)=>{ return (value.path == 'printAssessment'); }) > -1) {
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

    if (currentImage == 'diagrams') { this.diagramsReady = true; }
    if (currentImage == 'signature') { this.signatureReady = true; }

    if (this.diagramsReady && this.signatureReady) {   
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


  getJoinedString(stringArray : any) : string {
    if (stringArray === undefined || stringArray === null || (Array.isArray(stringArray) && stringArray.length == 0)) {
      return '';
    } else {
      return stringArray.join(', ');
    }
  }

}


