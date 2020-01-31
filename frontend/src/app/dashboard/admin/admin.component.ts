import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase } from '../../apiClient/model/companyCase';
import { CaseService } from '../../case/case.service';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonNamePipe } from '../../pipes/personName.pipe';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';



@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  public companyCases : CompanyCase[] = [];
  public escortsPaid : boolean[] = [];
  public invoiceSent : boolean[] = [];


  constructor(private caseService : CaseService,
              private domAccessor : ElementRef,
              private router : Router,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private toaster: ToastController) { }



  async ngOnInit() {            
    let loading = await this.loadingController.create({
      message: 'Retrieving cases...'
    });
    await loading.present();
    await this.loadAllActiveCases();
    await loading.dismiss();
  }

  async loadAllActiveCases() : Promise<void> {  
    (await this.caseService.getAllActiveCases()).subscribe(
      (activeCases : any[]) => { 
        console.log('INFO: Found some active cases for the Admin');
        console.log(activeCases);
        this.companyCases = activeCases as CompanyCase[];

        this.escortsPaid = this.companyCases.map( (v,i,l) => {
          return v.escorts.every( (vx,ix,lx) => { return (vx.paid == true); });
        });

        this.invoiceSent = this.companyCases.map( (v,i,l) => { return (v.invoiceSent == true); });
      }
    );
  }


  sortAscending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortascending');

    let sortedCompanyCases = this.companyCases.sort( (a : CompanyCase, b : CompanyCase) => {
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
    this.companyCases = sortedCompanyCases;
  }


  sortDescending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortdescending');

    let sortedCompanyCases = this.companyCases.sort( (a : CompanyCase, b : CompanyCase) => {
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
    this.companyCases = sortedCompanyCases;    
  }

  resetAllSorters() : void {
    let allSorters : any[] = this.domAccessor.nativeElement.getElementsByClassName('sorter');
    for (let i = 0; i < allSorters.length; i++) {
      allSorters[i].classList.remove('sortascending');
      allSorters[i].classList.remove('sortdescending');
    }
  }

  async toggleInvoiceSent(evt : MouseEvent | TouchEvent, caseID : string, index : number) : Promise<void> {

    // Hack to allow us to change the invoiced index after we have bound it to the UI
    let caseIndex : number = this.companyCases.findIndex( (v,i,l) => { return (v.caseID == caseID); });
    if (caseIndex == -1 || caseIndex != index) { return; }

    let selectedCase : CompanyCase = this.companyCases[caseIndex];

    let alert = await this.alertController.create({
      header: 'INVOICE CONFIRMATION', 
      message: 'Are you sure you want to send an invoice for this Case?', 
      buttons: [
        { text:'No', role: 'cancel',   cssClass: 'danger',      handler: (data)=>{
          this.invoiceSent[index] = false;
          evt.srcElement.classList.remove('toggle-checked');
        }},
        { text:'Yes', cssClass: 'primary',     handler: async (data)=>{            
          let loading = await this.loadingController.create({
            message: 'Recording invoice sent...'
          });
          await loading.present();

          selectedCase.invoiceSent = true;
          this.caseService.updateCase(selectedCase.companyID, selectedCase.caseID, selectedCase).subscribe(
            (success:boolean) => {
              this.loadAllActiveCases();
              setTimeout(()=>{ loading.dismiss();}, 1000);
            }
          )
        }}
      ]
    });
    alert.present();
  }

  viewCase(caseID : string) : void {
    this.router.navigate(['/case', 'view', caseID]);
  }



}
