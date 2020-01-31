import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  MatInputModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSortModule,
  MatTableModule,
  MatIconModule,
  MatExpansionModule,
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatAutocompleteModule,
  MatDatepickerModule,
  MatNativeDateModule } from '@angular/material';
import { TextInputAutocompleteModule } from 'angular-text-input-autocomplete';



import { LoginComponent } from './login/login.component';
import { Login2FAComponent } from './login2FA/login2FA.component';
import { LogoutComponent } from './logout/logout.component';
import { AuthGuard } from '../guards/auth-guard.service';
import { InviteUserComponent } from './invite-user/invite-user.component';
import { SetupUserComponent } from './setup-user/setup-user.component';
import { RoleGuard } from '../guards/role-guard.service';
import { JWTInterceptor } from './interceptor/jwtInterceptor';
import { EmailTakenValidator } from '../validators/emailTaken.validator';
import { SkycareCalendarModule } from '../controls/calendar/calendar.module';
import { SkycareFileUploaderModule } from '../controls/file-uploader/file-uploader.module';
import { SkycareFileViewerModule } from '../controls/file-viewer/file-viewer.module';
import { ClientProfileComponent } from './client-profile/client-profile.component';
import { EscortProfileComponent } from './escort-profile/escort-profile.component';
import { SkycareFileViewerComponent } from '../controls/file-viewer/file-viewer.component';
import { UsersComponent } from './users/users.component';



const routes: Routes = [
    {
      path: 'login',
      component: LoginComponent,
    },
    {
      path: 'login2FA',
      component: Login2FAComponent,
    },
    {
      path: 'logout',
      component: LogoutComponent,
      canActivate: [AuthGuard]
    }, 
    {
      path: 'inviteUser',
      component: InviteUserComponent,
      canActivate: [AuthGuard, RoleGuard],
      data: {role: 'admin'}
    },
    {
      path: 'setupUser/:resetID',
      component: SetupUserComponent,
    },
    {
      path: 'reset/:resetID',
      component: SetupUserComponent,
    },
    {
      path: 'profile/escort', 
      component: EscortProfileComponent, 
      canActivate: [AuthGuard, RoleGuard], 
      data: {role: 'escort'} 
    },
    { 
      path: 'profile/client', 
      component: ClientProfileComponent, 
      canActivate: [AuthGuard, RoleGuard], 
      data: {role: 'client'} 
    },
    { 
      path: 'users', 
      component: UsersComponent, 
      canActivate: [AuthGuard, RoleGuard], 
      data: {role: 'admin'} 
    }
  ];


@NgModule({
  declarations: [
    LoginComponent, 
    LogoutComponent, 
    Login2FAComponent, 
    InviteUserComponent, 
    SetupUserComponent, 
    ClientProfileComponent, 
    EscortProfileComponent, 
    UsersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SkycareCalendarModule,
    SkycareFileUploaderModule,
    SkycareFileViewerModule,
    RouterModule.forChild(routes),
    TextInputAutocompleteModule,

    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers:[AuthGuard, RoleGuard, ModalController]
})
export class AuthModule { }
