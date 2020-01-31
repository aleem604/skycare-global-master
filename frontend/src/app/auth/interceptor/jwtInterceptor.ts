import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { Injectable } from '@angular/core';
  


@Injectable()
export class JWTInterceptor implements HttpInterceptor {

    constructor(private authService: AuthService){}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Clone the request to add the new header
        //const clonedRequest = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + this.authService.getJWT()) });
        if (req.url.indexOf('complete2FA') != -1 || req.url.indexOf('sendNew2FAPINCode') != -1) {
            // 2FA login or 2FA resend - use the TEMP-JWT instead of the normal JWT
            req = req.clone({
                setHeaders: { 
                    Authorization: `Bearer ${this.authService.getTempJWT()}`
                }
            });
        } else if (req.url.indexOf('login') != -1 || req.url.indexOf('beginCredentialReset') != -1 || 
                   req.url.indexOf('finishCredentialReset') != -1 || req.url.indexOf('iatageo') != -1 ||
                   req.url.indexOf('exchangeratesapi') != -1 || req.url.indexOf('flightaware') != -1 ||
                   req.url.indexOf('publicCases') != -1) {
            console.log('INFO: Non-JWT secured route requested');
            console.log('INFO: ' + req.url);
            // NOOP - these are not JWT secured routes
        } else {
            // All other cases, use the normal JWT
            req = req.clone({
                setHeaders: { 
                    Authorization: `Bearer ${this.authService.getJWT()}`
                }
            });
        }

        // Pass the cloned request instead of the original request to the next handle
        return next.handle(req);
    }
}