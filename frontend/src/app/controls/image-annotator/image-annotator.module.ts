import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImageAnnotatorComponent } from './image-annotator.component';

@NgModule({
    declarations: [
      ImageAnnotatorComponent
    ],
    exports: [
      ImageAnnotatorComponent
    ],
    imports: [
      CommonModule
    ]
})
export class ImageAnnotatorModule {}