import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AgmCoreModule } from '@agm/core';
import { AgmDirectionModule } from 'agm-direction';

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
  MatNativeDateModule }                   from '@angular/material';
import { TextInputAutocompleteModule }    from 'angular-text-input-autocomplete';
import { SignaturePadModule }             from 'angular2-signaturepad';


import { CaseDetailsComponent }                 from './details/case-details.component';
import { CaseViewComponent }                    from './view/case-view.component';
import { AuthGuard }                            from '../guards/auth-guard.service';
import { RoleGuard }                            from '../guards/role-guard.service';
import { SkycareCalendarModule }                from '../controls/calendar/calendar.module';
import { SkycareFileUploaderModule }            from '../controls/file-uploader/file-uploader.module';
import { SkycareFileViewerModule }              from '../controls/file-viewer/file-viewer.module';
import { SkycareFileViewerComponent }           from '../controls/file-viewer/file-viewer.component';
import { ImageAnnotatorModule }                 from '../controls/image-annotator/image-annotator.module';
import { PatientAssessmentComponent }           from './patient-assessment/patient-assessment.component';
import { PatientConsentComponent }              from './patient-consent/patient-consent.component';
import { PatientProgressComponent }             from './patient-progress/patient-progress.component';
import { StatusChangeComponent }                from './status-change/status-change.component';
import { FinalizePatientProgressComponent }     from './finalize-patient-progress/finalize-patient-progress.component';
import { CompletedPatientAssessmentComponent }  from './completed-patient-assessment/completed-patient-assessment.component';
import { CompletedPatientConsentComponent }     from './completed-patient-consent/completed-patient-consent.component';
import { CompletedProgressNoteComponent }       from './completed-progress-note/completed-progress-note.component';
import { AddTravelReceiptComponent }            from './add-travel-receipt/add-travel-receipt.component';
import { ReceivablesComponent }                 from './receivables/receivables.component';
import { ArchivesComponent }                    from './archives/archives.component';
import { ArchivedCaseViewComponent }            from './viewArchived/archivedCase-view.component';
import { PrintableProgressNoteComponent }       from './printable-progress-note/printable-progress-note.component';
import { PrintablePatientConsentComponent }     from './printable-patient-consent/printable-patient-consent.component';
import { PrintablePatientAssessmentComponent }  from './printable-patient-assessment/printable-patient-assessment.component';
import { MapTrackingComponent }                 from './map-tracking/map-tracking.component';




const routes: Routes = [
  {
    path: 'create',
    component: CaseDetailsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'admin'}
  }, {
    path: 'edit/:caseID',
    component: CaseDetailsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'admin'}
  }, {
    path: 'limitedView/:externalAccessID',
    component: CaseViewComponent
  }, {
    path: 'view/:caseID',
    component: CaseViewComponent,
    canActivate: [AuthGuard]
  }, {
    path: 'receivables',
    component: ReceivablesComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'admin'}
  }, {
    path: 'archives',
    component: ArchivesComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'admin'}
  }, {
    path: 'viewArchived/:caseID',
    component: ArchivedCaseViewComponent,
    canActivate: [AuthGuard]
  }, {
    path: 'printAssessment/:caseID',
    component: PrintablePatientAssessmentComponent,
    canActivate: [AuthGuard]
  }, {
    path: 'printConsent/:caseID',
    component: PrintablePatientConsentComponent,
    canActivate: [AuthGuard]
  }, {
    path: 'printProgress/:caseID',
    component: PrintableProgressNoteComponent,
    canActivate: [AuthGuard]
  }
];



@NgModule({
  declarations: [
    CaseDetailsComponent,
    CaseViewComponent,
    PatientAssessmentComponent,
    PatientConsentComponent,
    PatientProgressComponent,
    StatusChangeComponent,
    FinalizePatientProgressComponent,
    CompletedPatientAssessmentComponent,
    CompletedPatientConsentComponent,
    CompletedProgressNoteComponent,
    AddTravelReceiptComponent,
    ReceivablesComponent,
    ArchivesComponent,
    ArchivedCaseViewComponent,
    PrintableProgressNoteComponent,
    PrintablePatientConsentComponent,
    PrintablePatientAssessmentComponent,
    MapTrackingComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SkycareCalendarModule,
    SkycareFileUploaderModule,
    SkycareFileViewerModule,
    ImageAnnotatorModule,
    RouterModule.forChild(routes),
    TextInputAutocompleteModule,
    SignaturePadModule,
    AgmCoreModule,
    AgmDirectionModule,

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  providers:[AuthGuard, RoleGuard, ModalController],
  entryComponents: [
    PatientAssessmentComponent,
    PatientConsentComponent,
    PatientProgressComponent,
    StatusChangeComponent,
    FinalizePatientProgressComponent,
    CompletedPatientAssessmentComponent,
    CompletedPatientConsentComponent,
    CompletedProgressNoteComponent,
    AddTravelReceiptComponent,
    MapTrackingComponent,    
  ]
})
export class CaseModule { }
