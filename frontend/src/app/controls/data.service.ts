import { Injectable }               from '@angular/core';
import { HttpClient, HttpRequest, HttpHeaders, HttpParams }               from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';

import { Buffer } from 'buffer';
import { BaseService } from '../base.service';
import { CustomHttpUrlEncodingCodec } from '../apiClient/encoder';
import { JSONP_ERR_NO_CALLBACK } from '@angular/common/http/src/jsonp';
import { EscortsControllerService } from '../apiClient';
import { NetworkMonitoringService } from '../netmon.service';



export interface GPSPoint {
    latitude: number,
    longitude: number
}


@Injectable({ providedIn: 'root' })
export class DataService extends BaseService {

    private allCountries : string[] = [];
    private allLanguages : string[] = [];
    private allCurrencies : string[] = [];

    constructor(private http : HttpClient,
                private escortService : EscortsControllerService,
                public readonly netmonService : NetworkMonitoringService) {
        super(netmonService, '');
        this.loadData();
    }

    private loadData() : void {
        let allData : any = require('./lookup_data.json');
        this.allCountries = allData.countries;
        this.allLanguages = allData.languages;
        this.allCurrencies = allData.currencies;
    }

    searchCountries(countryName : string) : Observable<string[]> {
        let filteredCountries : string[] = this.allCountries.filter(
            (value,index,list) => {
                return value.toLowerCase().indexOf(countryName.toLowerCase()) > -1;
            }
        )
        return of(filteredCountries);
    }

    searchLanguages(language : string) : Observable<string[]> {
        let filteredLanguages : string[] = this.allLanguages.filter(
            (value,index,list) => {
                return value.toLowerCase().indexOf(language.toLowerCase()) > -1;
            }
        )
        return of(filteredLanguages);
    }

    searchCurrencies(currency : string) : Observable<string[]> {
        let filteredCurrencies : string[] = this.allCurrencies.filter(
            (value,index,list) => {
                return value.toLowerCase().indexOf(currency.toLowerCase()) > -1;
            }
        )
        return of(filteredCurrencies);
    }

    getCurrencyFOREXRate(date : Date, sourceCurrency : string, destinationCurrency : string = 'USD', amount : number = 0) : Promise<number> {

        return new Promise<number>( (resolve, reject) => {
            let selectedDateMinusOne : Date = new Date(date.valueOf() - (24 * 60 * 60 * 1000));
            let selectedDate : string = (date.getFullYear()) + '-' + 
                                    (((date.getMonth() < 9) ? '0' : '') + (date.getMonth() + 1)) + '-' + 
                                    (((date.getDate() < 10) ? '0' : '') + date.getDate());
            let previousdDate : string = (selectedDateMinusOne.getFullYear()) + '-' + 
                                    (((selectedDateMinusOne.getMonth() < 9) ? '0' : '') + (selectedDateMinusOne.getMonth() + 1)) + '-' + 
                                    (((selectedDateMinusOne.getDate() < 10) ? '0' : '') + selectedDateMinusOne.getDate());
            

            let requestURL : string = 'https://api.exchangeratesapi.io/history?start_at=' + previousdDate + 
                                                '&end_at=' + selectedDate + 
                                                '&base=' + sourceCurrency +
                                                '&symbols=' + destinationCurrency;

            this.http.request('GET', requestURL).subscribe(
                (response:any) => {
                    let keys : string[] = Object.keys(response.rates);
                    let exchangeRate : number = parseFloat(response.rates[keys[0]][destinationCurrency]);

                    if (amount !== undefined && amount !== null && amount > 0) {
                        let calculatedAmount : number = Math.round((exchangeRate * amount) * 100) / 100;
                        resolve(calculatedAmount);
                    } else {
                        resolve(exchangeRate);
                    }
                },
                (error)=>{
                    console.log('The selected currency could not be converted');
                    console.log(error);
                    reject('The selected currency could not be converted');
                }
            );
        });
    }

    async getGPSCoordinatesForAirport(threeLetterAirportCode : string) : Promise<GPSPoint> {
        const BASE_URL : string = 'http://iatageo.com/getLatLng/';
        
        return this.http.request('GET', BASE_URL + threeLetterAirportCode).pipe(
            map( (response:any) => {
                if (response.error !== undefined && response.error.trim().length > 0) { 
                    return { latitude: 0.0, longitude: 0.0 }; 
                } else {
                    return {
                        latitude: parseFloat(response.latitude),
                        longitude: parseFloat(response.longitude)
                    };
                }
            })
        ).toPromise();
    }

    async acquireCurrentFlightLocation(flightNumber : string) : Promise<GPSPoint> {
        return this.escortService.trackFlightLocation(flightNumber).toPromise();
    }


    degreesToRadians(degrees) : number { return degrees * Math.PI / 180; }
      
    calculateGPSDistance(origin : GPSPoint, dest : GPSPoint) : string {
        const EARTH_RADIUS_KM : number = 6371;
      
        let latDiffRadians : number = this.degreesToRadians(dest.latitude - origin.latitude);
        let lonDiffRadians : number = this.degreesToRadians(dest.longitude - origin.longitude);
      
        let originLatitudeAsRadians : number = this.degreesToRadians(origin.latitude);
        let destLatitudeAsRadians : number = this.degreesToRadians(dest.latitude);
      
        var a = Math.sin(latDiffRadians/2) * Math.sin(latDiffRadians/2) +
                Math.sin(lonDiffRadians/2) * Math.sin(lonDiffRadians/2) * 
                Math.cos(originLatitudeAsRadians) * Math.cos(destLatitudeAsRadians); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return Math.floor(EARTH_RADIUS_KM * c).toString();      
    }

}
