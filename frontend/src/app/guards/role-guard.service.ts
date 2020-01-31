import {AuthService} from '../auth/auth.service';
import { Injectable } from '@angular/core';

import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, Route } from '@angular/router';

import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';


@Injectable()
export class RoleGuard implements CanActivate {

  constructor(private _authService: AuthService, 
              private _router: Router,
              private toastController: ToastController) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this._authService.getRole() === next.data.role) {
      return true;
    }

    // Present a toast message indicated they are not authorized to access the requested page due to a role restriction
    this.toastController.create({ message: 'Access denied. You do not have the required permissions.', duration: 2000 }).then( (toast) => { toast.present(); } );
    return false;
  }

}