import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin/admin.component';
import { EscortComponent } from './escort/escort.component';
import { ClientComponent } from './client/client.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth-guard.service';
import { RoleGuard } from '../guards/role-guard.service';
import { PersonNamePipe } from '../pipes/personName.pipe';

const DashboardRoutes: Routes = [
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [AuthGuard, RoleGuard], 
    data: {role: 'admin'} 
  },
  { 
    path: 'escort', 
    component: EscortComponent, 
    canActivate: [AuthGuard, RoleGuard], 
    data: {role: 'escort'} 
  },
  { 
    path: 'client', 
    component: ClientComponent, 
    canActivate: [AuthGuard, RoleGuard], 
    data: {role: 'client'} 
  }
];

@NgModule({
  declarations: [AdminComponent, EscortComponent, ClientComponent, PersonNamePipe],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(DashboardRoutes),
  ],
  providers: [AuthGuard, RoleGuard]
})
export class DashboardModule {
}
