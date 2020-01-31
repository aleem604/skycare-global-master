import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFileUploaderModule } from 'angular-file-uploader';
import { SkycareFileUploaderComponent } from './file-uploader.component';

@NgModule({
  declarations: [ SkycareFileUploaderComponent ],
  imports: [
    CommonModule,
    AngularFileUploaderModule
  ],
  exports: [ SkycareFileUploaderComponent ]
})
export class SkycareFileUploaderModule { }
