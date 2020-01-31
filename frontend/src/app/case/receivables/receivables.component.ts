import { Component, OnInit, ElementRef } from '@angular/core';
import { CaseService } from '../../case/case.service';
import { Router } from '@angular/router';
import { CompanyCase, Escort, CaseEscort, CaseEscortReceipt } from '../../apiClient';
import { DocumentsService } from '../../documents/documents.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-receivables',
  templateUrl: './receivables.component.html',
  styleUrls: ['./receivables.component.scss']
})
export class ReceivablesComponent implements OnInit {

  public unpaidCases : CompanyCase[] = [];
  public casesPaid : boolean[] = [];
  public totalReceivables : number = 0;


  constructor(private caseService : CaseService,
              private docService : DocumentsService,
              private domAccessor : ElementRef,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private router : Router) { }



  ngOnInit() {
    this.loadAllUnpaidCases();
  }

  loadAllUnpaidCases() : void {
    this.caseService.getCaseReceivables().subscribe(
      (cases : CompanyCase[]) => { 
        this.unpaidCases = cases;
        this.casesPaid = this.casesPaid.fill(false, 0, this.unpaidCases.length);

        this.totalReceivables = this.unpaidCases.reduce<number>( (pv:number, cv:CompanyCase, i:number, l:CompanyCase[])=>{ return pv + parseFloat(cv.quotedPrice);}, 0.0);
      }
    );
  }

  sortAscending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortascending');

    let sortedCases = this.unpaidCases.sort( (a : any, b : any) => {
      let valueA : string = ((a[columnName] === undefined) ? '' : a[columnName].toString().toLowerCase());
      let valueB : string = ((b[columnName] === undefined) ? '' : b[columnName].toString().toLowerCase());
      if (valueA < valueB) {
        return -1;
      } else if (valueA > valueB) {
        return 1;
      } else {
        return 0;
      }
    });
    this.unpaidCases = sortedCases;
  }


  sortDescending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortdescending');

    let sortedCases = this.unpaidCases.sort( (a : any, b : any) => {
      let valueA : string = ((a[columnName] === undefined) ? '' : a[columnName].toString().toLowerCase());
      let valueB : string = ((b[columnName] === undefined) ? '' : b[columnName].toString().toLowerCase());
      if (valueA < valueB) {
        return 1;
      } else if (valueA > valueB) {
        return -1;
      } else {
        return 0;
      }
    });
    this.unpaidCases = sortedCases;    
  }

  resetAllSorters() : void {
    let allSorters : any[] = this.domAccessor.nativeElement.getElementsByClassName('sorter');
    for (let i = 0; i < allSorters.length; i++) {
      allSorters[i].classList.remove('sortascending');
      allSorters[i].classList.remove('sortdescending');
    }
  }


  async toggleCasePaid(evt : MouseEvent | TouchEvent, caseID : string, index : number) : Promise<void> {
    let alert = await this.alertController.create({
      header: 'PAYMENT CONFIRMATION', 
      message: 'Are you sure you want to confirm receipt of payment for this Case?', 
      buttons: [
        { text:'No', role: 'cancel',   cssClass: 'danger',      handler: (data)=>{
          this.unpaidCases[index].invoicePaid = false;
          evt.srcElement.classList.remove('toggle-checked');
        }},
        { text:'Yes', cssClass: 'primary',     handler: async (data)=>{ 
           
          let loading = await this.loadingController.create({
            message: 'Recording case payment...'
          });
          await loading.present();
          
          this.caseService.markCasePaid(this.unpaidCases[index].caseID).subscribe(
            (success:boolean) => {
              this.unpaidCases = [];
              this.loadAllUnpaidCases();
              setTimeout(()=>{ loading.dismiss();}, 1000);
            }
          );

        }}
      ]
    });
    alert.present();
  }

}
