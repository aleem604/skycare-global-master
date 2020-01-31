import { Component, OnInit, ViewChild, ElementRef }        from '@angular/core';
import { Observable }               from 'rxjs';
import { debounceTime, switchMap }  from 'rxjs/operators';


import { ToastController, 
          LoadingController }       from '@ionic/angular';

import { Validators, 
          FormBuilder, 
          FormGroup, 
          FormControl }             from '@angular/forms';

import {  MatExpansionModule,
          MatAccordion, 
          MatExpansionPanel, 
          MatExpansionPanelHeader, 
          MatExpansionPanelTitle, 
          MatExpansionPanelDescription,
          MatExpansionPanelActionRow,
          MatDatepicker,
          MatFormField,
          MatIcon,
          MatInput, }               from '@angular/material'; 


import { Escort }                   from '../../apiClient';
import { DataService, GPSPoint }              from '../../controls/data.service';
import { AuthService }              from '../../auth/auth.service';
import { DateValidator }            from '../../validators/date.validator';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {


  public passportCountries : Observable<string[]>;
  public languages1 : Observable<string[]>;
  public languages2 : Observable<string[]>;

  public search : any = {
    escortCerts : '',
    passportCountry : '',
    language1 : '',
    language2 : '',
    homeAirportCity : '',
    startDate : '',
    endDate : ''
  };

  public searchResults : Escort[] = [];
  public searchDisabled : boolean = false;


  public searchForm: FormGroup;
  @ViewChild('passportCountryControl')  public passportCountryControl : MatInput;
  @ViewChild('language1Control')        public language1Control : MatInput;
  @ViewChild('language2Control')        public language2Control : MatInput;

  public validationMessages : any = {
    'startDate': [
      { type: 'not-after-yesterday', message: 'Start date must be after yesterday.' }
    ],
    'endDate': [
      { type: 'not-after-today', message: 'End date must be after today.' }
    ],
  };




  constructor(private toaster: ToastController,
              private loader: LoadingController,
              private domAccessor : ElementRef,
              private dataService: DataService,
              private authService: AuthService,
              private formBuilder: FormBuilder ) { }

  ngOnInit() {

    this.searchForm = this.formBuilder.group({
      escortCertControl: new FormControl(''),
      passportCountryControl: new FormControl(''),
      language1Control: new FormControl(''),
      language2Control: new FormControl(''),
      homeAirportCityControl: new FormControl(''),
      startDateControl: new FormControl('', Validators.compose([
                            DateValidator.isAfterYesterday(false)
                        ])),
      endDateControl: new FormControl('', Validators.compose([
                            DateValidator.isAfterToday(false)
                        ]))
    });



    this.passportCountries = this.searchForm.get('passportCountryControl').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchCountries(newValue);
      })
    );

    this.languages1 = this.searchForm.get('language1Control').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchLanguages(newValue);
      })
    );

    this.languages2 = this.searchForm.get('language2Control').valueChanges.pipe(
      debounceTime(500),
      switchMap((newValue:any) => {
        if (newValue === undefined) { return; }
        return this.dataService.searchLanguages(newValue);
      })
    );

    this.searchForm.statusChanges.subscribe( (changed)=>{ this.searchDisabled = this.searchForm.invalid; });
  }


  async executeSearch() : Promise<void> {
    let loading = await this.loader.create({ message: 'Searching escorts...' });
    await loading.present();

    if (this.search.homeAirportCity !== undefined && this.search.homeAirportCity.trim().length > 0) {
      this.search.homeAirportCity = this.search.homeAirportCity.toUpperCase();
    }
    this.authService.searchForEscorts(this.search).subscribe(async (escorts:Escort[])=>{
      this.searchResults = escorts;
      
      if (this.search.homeAirportCity !== undefined && this.search.homeAirportCity.trim().length > 0) {
        await this.computeDistanceFromPatientAirport();
      }

      await loading.dismiss();
    });
  }

  async computeDistanceFromPatientAirport() : Promise<void> {
    let patientAirportGPSPoint : GPSPoint = await this.dataService.getGPSCoordinatesForAirport(this.search.homeAirportCity);
    if (patientAirportGPSPoint.latitude == 0.0 && patientAirportGPSPoint.longitude == 0.0) { 
      return;
    }

    for (let i = 0; i < this.searchResults.length; i++) {
      let escortGPSPoint : GPSPoint = await this.dataService.getGPSCoordinatesForAirport(this.searchResults[i].homeAirportCity);
      if (escortGPSPoint.latitude == 0.0 && escortGPSPoint.longitude == 0.0) {        
        (this.searchResults[i] as any).searchResultDistance = '?';
        continue;
      } else {
        (this.searchResults[i] as any).searchResultDistance = this.dataService.calculateGPSDistance(patientAirportGPSPoint, escortGPSPoint);        
      }
    }
  }

  viewEscort(escortID : string) : void {
    
  }




  sortAscending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortascending');

    let sortedEscorts = this.searchResults.sort( (a : Escort, b : Escort) => {
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
    this.searchResults = sortedEscorts;
  }


  sortDescending(clickedSorter:any, columnName:string) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortdescending');

    let sortedEscorts = this.searchResults.sort( (a : Escort, b : Escort) => {
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
    this.searchResults = sortedEscorts;    
  }


  resetAllSorters() : void {
    let allSorters : any[] = this.domAccessor.nativeElement.getElementsByClassName('sorter');
    for (let i = 0; i < allSorters.length; i++) {
      allSorters[i].classList.remove('sortascending');
      allSorters[i].classList.remove('sortdescending');
    }
  }


}
