import { Component, OnInit, ElementRef } from '@angular/core';
import { CaseService } from '../../case/case.service';
import { Router } from '@angular/router';
import { CompanyCase, Escort, CaseEscort, CaseEscortReceipt } from '../../apiClient';
import { DocumentsService } from '../../documents/documents.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss']
})
export class PayComponent implements OnInit {

  public unpaidEscorts : any[] = [];
  public escortsPaid : boolean[] = [];



  constructor(private caseService : CaseService,
              private docService : DocumentsService,
              private domAccessor : ElementRef,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private router : Router) { }



  ngOnInit() {
    this.loadAllUnpaidEscorts();
  }

  loadAllUnpaidEscorts() : void {
    this.caseService.getUnpaidEscortCases().subscribe(
      (activeCases : CompanyCase[]) => { 

        for (let i = 0; i < activeCases.length; i++) {
          let currentCase : CompanyCase = activeCases[i];

          for (let j = 0; j < currentCase.escorts.length; j++) {
            let currentEscort : CaseEscort = currentCase.escorts[j];
            let currentUnpaidEscort : any = {
              caseID : currentCase.caseID,
              escortID : '',
              escortName : '',
              escortPaid : false,
              escortExpenses : 0.0,
              diagnosis : currentCase.diagnosis,
              originCity : currentCase.originCity,
              destinationCity : currentCase.destinationCity,
              daysOfTravel : parseFloat(currentCase.numberTravelDays),
              payPerDay : parseFloat(currentCase.payPerDay),
              totalPay : 0.0
            };
            
            if (currentEscort.paid == false) {
              currentUnpaidEscort.escortID = currentEscort.escortID;
              currentUnpaidEscort.escortName = currentEscort.name;
              currentUnpaidEscort.escortExpenses = 0.00;

              let totalEscortReceipts : number = currentCase.escortReceipts.filter( (v,i,l)=>{ if(v.caseID==currentCase.caseID && v.escortID==currentEscort.escortID){ return v; }})
                                                                           .reduce<number>( (pvx,cvx,ix,lx)=>{ return pvx + parseFloat(cvx.usdAmount); }, 0.0);
              if (totalEscortReceipts > 0) { currentUnpaidEscort.escortExpenses = totalEscortReceipts; }    
              
              currentUnpaidEscort.totalPay = (currentUnpaidEscort.daysOfTravel * currentUnpaidEscort.payPerDay) + currentUnpaidEscort.escortExpenses;
              this.unpaidEscorts.push(currentUnpaidEscort);
            }
          }
        }

        this.escortsPaid = this.escortsPaid.fill(false, 0, this.unpaidEscorts.length);
      }
    );
  }

  sortAscending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortascending');

    let sortedEscorts = this.unpaidEscorts.sort( (a : any, b : any) => {
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
    this.unpaidEscorts = sortedEscorts;
  }


  sortDescending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortdescending');

    let sortedEscorts = this.unpaidEscorts.sort( (a : any, b : any) => {
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
    this.unpaidEscorts = sortedEscorts;    
  }

  resetAllSorters() : void {
    let allSorters : any[] = this.domAccessor.nativeElement.getElementsByClassName('sorter');
    for (let i = 0; i < allSorters.length; i++) {
      allSorters[i].classList.remove('sortascending');
      allSorters[i].classList.remove('sortdescending');
    }
  }


  async toggleEscortPaid(evt : MouseEvent | TouchEvent, caseID : string, escortID : string, index : number) : Promise<void> {
    let alert = await this.alertController.create({
      header: 'PAYMENT CONFIRM', 
      message: 'Are you sure you want to complete Escort payment?', 
      buttons: [
        { text:'No', role: 'cancel',   cssClass: 'danger',      handler: (data)=>{
          this.unpaidEscorts[index].escortPaid = false;
          evt.srcElement.classList.remove('toggle-checked');
        }},
        { text:'Yes', cssClass: 'primary',     handler: async (data)=>{ 
           
          let loading = await this.loadingController.create({
            message: 'Recording escort payment...'
          });
          await loading.present();

          this.caseService.markEscortPaid(caseID, escortID).subscribe(
            (success:boolean) => {
              this.unpaidEscorts = [];
              this.loadAllUnpaidEscorts();
              setTimeout(()=>{ loading.dismiss();}, 1000);
            }
          );

        }}
      ]
    });
    alert.present();
  }

}
