import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'skycare-calendar-header',
  templateUrl: 'calendar-header.component.html'
})
export class SkycareCalendarHeaderComponent {
  @Input()
  view: string;

  @Input()
  viewDate: Date;

  @Input()
  locale: string = 'en';

  @Output()
  viewChange: EventEmitter<string> = new EventEmitter();

  @Output()
  viewDateChange: EventEmitter<Date> = new EventEmitter();
}
