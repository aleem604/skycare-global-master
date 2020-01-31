import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { 
  HttpClientModule,  
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AgmCoreModule }                  from '@agm/core';
import { AgmDirectionModule }             from 'agm-direction';



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
  MatDatepickerModule,
  MatAutocompleteModule,
  MatNativeDateModule } from "@angular/material";
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ApiModule, Configuration } from './apiClient/index';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { DocumentsService } from './documents/documents.service';
import { CaseModule } from './case/case.module';
import { CaseService }  from './case/case.service';
import { DataService } from './controls/data.service';
import { EscortService } from './escort/escort.service';
import { NetworkMonitoringService } from './netmon.service';

import { EmailTakenValidator } from './validators/emailTaken.validator';
import { TextInputAutocompleteModule } from 'angular-text-input-autocomplete';
import { SkycareCalendarModule } from './controls/calendar/calendar.module';
import { SkycareFileUploaderModule } from './controls/file-uploader/file-uploader.module';
import { SkycareFileViewerModule } from './controls/file-viewer/file-viewer.module';
import { ImageAnnotatorModule } from './controls/image-annotator/image-annotator.module';


import { JWTInterceptor } from './auth/interceptor/jwtInterceptor';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
 

export function getAPIConfig() {
  let API_URL : string = environment.backendURL;
  //let API_URL : string = window.location.protocol + '//' + window.location.hostname + ':3000';
  //let API_URL : string = 'http://192.168.1.160:3000';
  return new Configuration({basePath:API_URL});
}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,

    AuthModule,
    CaseModule,
    SkycareCalendarModule,
    SkycareFileUploaderModule,
    SkycareFileViewerModule,
    ImageAnnotatorModule,
    ApiModule.forRoot(getAPIConfig),
    TextInputAutocompleteModule,
    AgmCoreModule.forRoot({
      apiKey: environment.googleAPIKey,
    }),
    AgmDirectionModule,  
    
    BrowserAnimationsModule,
    MatExpansionModule,
    DragDropModule,
    ScrollingModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule, 
    MatCardModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ServiceWorkerModule.register(environment.serviceWorkerScript)

  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JWTInterceptor,
      multi: true,
    },
    { 
      provide: RouteReuseStrategy, 
      useClass: IonicRouteStrategy 
    },
    StatusBar,
    SplashScreen,

    AuthService,
    DataService,
    DocumentsService,
    CaseService,
    EscortService,
    NetworkMonitoringService,
    EmailTakenValidator,

  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
