import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import {
  MatInputModule,
  MatFormFieldModule,
  MatExpansionModule,
  MatDatepickerModule,
  MatAutocompleteModule,
  MatNativeDateModule,
  MatIconModule  } from '@angular/material';

import { PayComponent }           from './pay/pay.component';
import { SearchComponent }        from './search/search.component';
import { AuthGuard }              from '../guards/auth-guard.service';
import { RoleGuard }              from '../guards/role-guard.service';
import { SkycareCalendarModule }  from '../controls/calendar/calendar.module';


const routes: Routes = [
  {
    path: 'pay',
    component: PayComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'admin'}
  }, 
  {
    path: 'search',
    component: SearchComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'admin'}
  }
];


@NgModule({
  declarations: [PayComponent, SearchComponent],
  providers:[AuthGuard, RoleGuard, ModalController],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),

    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,

    SkycareCalendarModule
  ]
})
export class EscortModule { }
