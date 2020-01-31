import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { SkycareCalendarComponent } from './calendar.component';
import { SkycareCalendarHeaderComponent } from './calendar-header.component';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

@NgModule({
  imports: [
    CommonModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  declarations: [ SkycareCalendarComponent, SkycareCalendarHeaderComponent ],
  exports: [ SkycareCalendarComponent, SkycareCalendarHeaderComponent ]
})
export class SkycareCalendarModule { }
