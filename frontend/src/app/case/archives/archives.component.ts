import { Component, OnInit, ElementRef } from '@angular/core';
import { CaseService } from '../../case/case.service';
import { Router } from '@angular/router';
import { CompanyCase, Escort, CaseEscort, CaseEscortReceipt } from '../../apiClient';
import { DocumentsService } from '../../documents/documents.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-archives',
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.scss']
})
export class ArchivesComponent implements OnInit {

  public archivedCases : CompanyCase[] = [];


  constructor(private caseService : CaseService,
              private docService : DocumentsService,
              private domAccessor : ElementRef,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private router : Router) { }



  ngOnInit() {
    this.caseService.getArchivedCases().subscribe( (cases : CompanyCase[]) => { this.archivedCases = cases; } );
  }

  sortAscending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortascending');

    let sortedCases = this.archivedCases.sort( (a : any, b : any) => {
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
    this.archivedCases = sortedCases;
  }


  sortDescending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortdescending');

    let sortedCases = this.archivedCases.sort( (a : any, b : any) => {
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
    this.archivedCases = sortedCases;    
  }

  resetAllSorters() : void {
    let allSorters : any[] = this.domAccessor.nativeElement.getElementsByClassName('sorter');
    for (let i = 0; i < allSorters.length; i++) {
      allSorters[i].classList.remove('sortascending');
      allSorters[i].classList.remove('sortdescending');
    }
  }

  viewArchivedCase(caseID : string) : void {
    this.router.navigate(['/case', 'viewArchived', caseID]);
  }

}
