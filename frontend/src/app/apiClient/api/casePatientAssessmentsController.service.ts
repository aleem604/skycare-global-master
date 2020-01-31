/**
 * LoopBack Application
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *//* tslint:disable:no-unused-variable member-ordering */

 import { Inject, Injectable, Optional }                      from '@angular/core';

 import { HttpClient, HttpHeaders, HttpParams,
          HttpResponse, HttpEvent }                           from '@angular/common/http';
 import { CustomHttpUrlEncodingCodec }                        from '../encoder';
  
 import { Observable, from }                                        from 'rxjs';

 
 import { CasePatientAssessment }                             from '../model/casePatientAssessment';
 import { Filter }                                            from '../model/filter';
 
 
 import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
 import { Configuration }                                     from '../configuration';


@Injectable()
export class CasePatientAssessmentsControllerService {

    protected basePath = 'http://localhost:3000';
    public defaultHeaders = new HttpHeaders();
    public configuration = new Configuration();

    constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (basePath) {
            this.basePath = basePath;
        }
        if (configuration) {
            this.configuration = configuration;
            this.basePath = basePath || configuration.basePath || this.basePath;
        }
    }

    /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
    private canConsumeForm(consumes: string[]): boolean {
        const form = 'multipart/form-data';
        for (const consume of consumes) {
            if (form === consume) {
                return true;
            }
        }
        return false;
    }


    /**
     * 
     * 
     * @param caseID 
     * @param filter 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getPatientAssessment(caseID: string, filter?: Filter, observe?: 'body', reportProgress?: boolean): Observable<Array<CasePatientAssessment>>;
    public getPatientAssessment(caseID: string, filter?: Filter, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<CasePatientAssessment>>>;
    public getPatientAssessment(caseID: string, filter?: Filter, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<CasePatientAssessment>>>;
    public getPatientAssessment(caseID: string, filter?: Filter, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (caseID === null || caseID === undefined) {
            throw new Error('Required parameter caseID was null or undefined when calling getPatientAssessment.');
        }

        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (filter !== undefined && filter !== null) {
            queryParameters = queryParameters.set('filter', <any>filter);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [ 'application/json' ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [];
        return this.httpClient.get<Array<CasePatientAssessment>>(`${this.basePath}/companies/UNKNOWN/cases/${encodeURIComponent(String(caseID))}/patientAssessment`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * 
     *  
     * @param caseID 
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public patchPatientAssessment(caseID: string, body?: CasePatientAssessment, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public patchPatientAssessment(caseID: string, body?: CasePatientAssessment, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public patchPatientAssessment(caseID: string, body?: CasePatientAssessment, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public patchPatientAssessment(caseID: string, body?: CasePatientAssessment, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (caseID === null || caseID === undefined) {
            throw new Error('Required parameter caseID was null or undefined when calling patchPatientAssessment.');
        }

        // Assemble the URL and the Request
        let url : string = `${this.basePath}/companies/UNKNOWN/cases/${encodeURIComponent(String(caseID))}/patientAssessment`;
        let requestInit = {
            method: 'PATCH',
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(body)
        };


        // Send the request and package the response as an Observable
        return from(fetch(url, requestInit)
                    .then((response)=>{
                        if (response.ok) {
                            return response.json();
                        }
                        console.log(response);
                        throw new Error('The response was not ok');
                    })
        );
    }

    /**
     * 
     * 
     * @param caseID 
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public postPatientAssessment(caseID: string, body?: CasePatientAssessment, observe?: 'body', reportProgress?: boolean): Observable<CasePatientAssessment>;
    public postPatientAssessment(caseID: string, body?: CasePatientAssessment, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<CasePatientAssessment>>;
    public postPatientAssessment(caseID: string, body?: CasePatientAssessment, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<CasePatientAssessment>>;
    public postPatientAssessment(caseID: string, body?: CasePatientAssessment, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (caseID === null || caseID === undefined) {
            throw new Error('Required parameter caseID was null or undefined when calling postPatientAssessment.');
        }

        // Assemble the URL and the Request
        let url : string = `${this.basePath}/companies/UNKNOWN/cases/${encodeURIComponent(String(caseID))}/patientAssessment`;
        let requestInit = {
            method: 'POST',
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(body)
        };


        // Send the request and package the response as an Observable
        return from(fetch(url, requestInit)
                    .then((response)=>{
                        if (response.ok) {
                            return response.json();
                        }
                        console.log(response);
                        throw new Error('The response was not ok');
                    })
        );
    }

}
