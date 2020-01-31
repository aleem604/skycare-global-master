import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase } from '../../apiClient/model/companyCase';
import { CaseService } from '../../case/case.service';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {

  
  public companyCases : CompanyCase[] = [];


  constructor(private caseService : CaseService,
              private authService : AuthService,
              private domAccessor : ElementRef,
              private loadingController: LoadingController,
              private router : Router) { }


  
  
  async ngOnInit() {            
    let loading = await this.loadingController.create({
      message: 'Retrieving cases...'
    });
    await loading.present();

    (await this.authService.loadProfile()).subscribe(async (profile: any) => { 
      await this.loadAllActiveCases(profile.companyID);
      await loading.dismiss();
    });
  }

  async loadAllActiveCases(companyID : string) : Promise<void> {
    (await this.caseService.getAllActiveCases(companyID)).subscribe(
      (activeCases : any[]) => { 
        console.log('INFO: Found some active cases for the Client');
        console.log(activeCases);
        this.companyCases = activeCases as CompanyCase[];
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

  viewCase(caseID : string) : void {
    this.router.navigate(['/case', 'view', caseID]);
  }

}
