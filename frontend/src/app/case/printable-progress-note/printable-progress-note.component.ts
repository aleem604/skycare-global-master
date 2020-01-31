import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase } from '../../apiClient';
import { ModalController, NavParams, ToastController } from '@ionic/angular';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { CaseService } from '../case.service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-printable-progress-note',
  templateUrl: './printable-progress-note.component.html',
  styleUrls: ['./printable-progress-note.component.scss']
})
export class PrintableProgressNoteComponent implements OnInit {

  public caseID : string = '';
  public medicalProviderReady : boolean = false;
  public escort1Ready : boolean = false;
  public escort2Ready : boolean = false;

  public currentCase : CompanyCase = {
    patientProgress : {
      patientProgressID: '',
      caseID: '',  
      patientBelongings: false,  
      statusUpdates: [],
      medications: [],
      notes: []
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
        if (segments.findIndex( (value,index,list)=>{ return (value.path == 'printProgress'); }) > -1) {
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

    if (currentImage == 'medicalProvider') { this.medicalProviderReady = true; }
    if (currentImage == 'escort1') { this.escort1Ready = true; }
    if (currentImage == 'escort2') { this.escort2Ready = true; }

    if (this.medicalProviderReady && this.escort1Ready && (this.escort2Ready || this.currentCase.patientProgress.escort2Signature === undefined)) {   
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

    outlet.shadowRoot.firstChild.innerHTML = osPrefix + osSuffix;

    setTimeout( ()=>{ window.print(); }, 3000);
  }

}
