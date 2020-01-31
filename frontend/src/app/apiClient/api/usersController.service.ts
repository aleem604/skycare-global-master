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
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';



import { Observable }                                        from 'rxjs/';



//import { BigDecimal } from 'bigdecimal';

import { CredentialReset } from '../model/credentialReset';

import { User } from '../model/user';


import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';
import { AppFeedback } from '../model/app-feedback';





@Injectable()


export class UsersControllerService {


    protected basePath = 'http://127.0.0.1:3000';
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
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public beginCredentialResetPost(body?: CredentialReset, observe?: 'body', reportProgress?: boolean): Observable<boolean>;
    public beginCredentialResetPost(body?: CredentialReset, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<boolean>>;
    public beginCredentialResetPost(body?: CredentialReset, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<boolean>>;
    public beginCredentialResetPost(body?: CredentialReset, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [            
            'application/json'            
        ];

        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post(`${this.basePath}/beginCredentialReset`,
            body,
            {
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
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public finishCredentialResetPost(body?: CredentialReset, observe?: 'body', reportProgress?: boolean): Observable<boolean>;
    public finishCredentialResetPost(body?: CredentialReset, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<boolean>>;
    public finishCredentialResetPost(body?: CredentialReset, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<boolean>>;
    public finishCredentialResetPost(body?: CredentialReset, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [            
            'application/json'            
        ];

        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post(`${this.basePath}/finishCredentialReset`,
            body,
            {
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
     * @param authorization 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public loginPost(authorization?: string, rememberMe? : boolean, observe?: 'body', reportProgress?: boolean): Observable<boolean>;
    public loginPost(authorization?: string, rememberMe? : boolean, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<boolean>>;
    public loginPost(authorization?: string, rememberMe? : boolean, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<boolean>>;
    public loginPost(authorization?: string, rememberMe? : boolean, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        
        if (rememberMe === undefined || rememberMe === null || rememberMe == false) {               
            queryParameters = queryParameters.set('rememberMe', <any>false);        
        } else {             
            queryParameters = queryParameters.set('rememberMe', <any>true);        
        }

        let headers = this.defaultHeaders;        
        
        if (authorization !== undefined && authorization !== null) {
            headers = headers.set('Authorization', String(authorization));
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [];

        return this.httpClient.post(`${this.basePath}/login`,
            {},
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
     * @param verificationCode 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */    
    public complete2FAPost(verificationCode: string, observe?: 'body', reportProgress?: boolean): Observable<string>;
    public complete2FAPost(verificationCode: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public complete2FAPost(verificationCode: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public complete2FAPost(verificationCode: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        if (verificationCode === null || verificationCode === undefined) {
            throw new Error('Required parameter verificationCode was null or undefined when calling complete2FAPost.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'text/plain'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [];

        return this.httpClient.post(`${this.basePath}/complete2FA/${verificationCode}`, {},
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                responseType: 'text',
                reportProgress: reportProgress
            }
        );
    }


    /**
     * 
     * 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */    
    public sendNew2FAPINCodePost(observe?: 'body', reportProgress?: boolean): Observable<string>;
    public sendNew2FAPINCodePost(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public sendNew2FAPINCodePost(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public sendNew2FAPINCodePost(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [  
            'text/plain'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [];

        return this.httpClient.post(`${this.basePath}/sendNew2FAPINCode`, {},
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                responseType: 'text',
                reportProgress: reportProgress
            }
        );
    }


    /**
     * 
     * 
     * @param resetID 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */    
    public finishCredentialResetResetIDGet(resetID: string, observe?: 'body', reportProgress?: boolean): Observable<boolean>;
    public finishCredentialResetResetIDGet(resetID: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<boolean>>;
    public finishCredentialResetResetIDGet(resetID: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<boolean>>;
    public finishCredentialResetResetIDGet(resetID: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        if (resetID === null || resetID === undefined) {
            throw new Error('Required parameter resetID was null or undefined when calling finishCredentialResetResetIDGet.');
        }

        let headers = this.defaultHeaders;
        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [];

        return this.httpClient.get(`${this.basePath}/finishCredentialReset/${encodeURIComponent(String(resetID))}`,
            {
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
     * @param email 
     * @param resetID 
     * @param authorization 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public usersGet(email?: string, resetID?: string, authorization?: string, observe?: 'body', reportProgress?: boolean): Observable<string>;
    public usersGet(email?: string, resetID?: string, authorization?: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<string>>;
    public usersGet(email?: string, resetID?: string, authorization?: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<string>>;
    public usersGet(email?: string, resetID?: string, authorization?: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        
        if (email !== undefined && email !== null) {               
            queryParameters = queryParameters.set('email', <any>email);        
        }
        
        if (resetID !== undefined && resetID !== null) {       
            queryParameters = queryParameters.set('resetID', <any>resetID);        
        }

        let headers = this.defaultHeaders;       
        
        if (authorization !== undefined && authorization !== null) {
            headers = headers.set('Authorization', String(authorization));
        }
        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'text/plain'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [            
        ];

        return this.httpClient.get(`${this.basePath}/users`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                responseType: 'text',
                reportProgress: reportProgress
            }
        );
    }



    /**
     * 
     * 
     * @param id 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public usersIdGet(id: string, observe?: 'body', reportProgress?: boolean): Observable<User>;
    public usersIdGet(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<User>>;
    public usersIdGet(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<User>>;
    public usersIdGet(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling usersIdGet.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [];

        return this.httpClient.get(`${this.basePath}/users/${encodeURIComponent(id)}`,
            {
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
     * @param id 
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public usersIdPatch(id: string, body?: User, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public usersIdPatch(id: string, body?: User, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public usersIdPatch(id: string, body?: User, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public usersIdPatch(id: string, body?: User, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling usersIdPatch.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [            
            'application/json'            
        ];

        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.patch(`${this.basePath}/users/${encodeURIComponent(id)}`,
            body,
            {
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
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    
    public usersPost(body?: User, observe?: 'body', reportProgress?: boolean): Observable<User>;
    public usersPost(body?: User, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<User>>;
    public usersPost(body?: User, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<User>>;
    public usersPost(body?: User, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [            
            'application/json'            
        ];

        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post(`${this.basePath}/users`,
            body,
            {
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
     * @param usersToDelete comma-separated list of userIDs
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public usersDelete(usersToDelete?: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public usersDelete(usersToDelete?: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public usersDelete(usersToDelete?: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public usersDelete(usersToDelete?: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {


        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (usersToDelete !== undefined && usersToDelete !== null) {
            queryParameters = queryParameters.set('usersToDelete', <any>usersToDelete);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.delete<any>(`${this.basePath}/users`,
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
     * @param body 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */    
    public sendAppFeedback(body?: AppFeedback, observe?: 'body', reportProgress?: boolean): Observable<AppFeedback>;
    public sendAppFeedback(body?: AppFeedback, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<AppFeedback>>;
    public sendAppFeedback(body?: AppFeedback, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<AppFeedback>>;
    public sendAppFeedback(body?: AppFeedback, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
    
        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [            
            'application/json'            
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [            
            'application/json'            
        ];

        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post(`${this.basePath}/app-feedbacks`,
            body,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }




}