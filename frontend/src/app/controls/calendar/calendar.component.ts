
import { 
  Component, 
  ElementRef,
  forwardRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild, 
  ChangeDetectionStrategy, 
  ViewEncapsulation} from '@angular/core';
import { 
  ControlValueAccessor, 
  FormControl, 
  Validator,
  ValidationErrors,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarEvent, CalendarMonthViewDay, CalendarDateFormatter } from 'angular-calendar';
import { CustomDateFormatter } from './custom.dateformatter';

import { CalendarMonthViewComponent } from 'angular-calendar';



const COUNTER_CONTROL_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SkycareCalendarComponent),
  multi: true
};

const VALIDATOR = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => SkycareCalendarComponent),
    multi: true
};


@Component({
  selector: 'skycare-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [
    VALIDATOR,
    COUNTER_CONTROL_ACCESSOR,
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter
    }
  ],
  encapsulation: ViewEncapsulation.None
})
export class SkycareCalendarComponent implements OnInit, ControlValueAccessor, Validator {

  @Input() view: string = 'month';
  @Input() show2Months: boolean = true;
  @Input() usage : string = 'multi-day-chooser'; // Others include event-schedule or overlap-viewer
  @Output() onDateClicked: EventEmitter<any> = new EventEmitter();

  // ELEMENT REF
  @ViewChild('currentMonthCalendarControl') currentMonthCalendarControl: CalendarMonthViewComponent;
  @ViewChild('nextMonthCalendarControl') nextMonthCalendarControl: CalendarMonthViewComponent;

  // CONTROL VALUE ACCESSOR FUNCTIONS
  onTouch: Function;
  onModelChange: Function;

  viewDate: Date = new Date();
  viewDateNextMonth: Date = new Date(new Date((new Date()).setDate(1)).setMonth(this.viewDate.getMonth()+1));
  selectedMonthViewDate: CalendarMonthViewDay;
  selectedDates: string[] = [];
  events: CalendarEvent[] = [];

  value: string = '';



  constructor() { }

  ngOnInit() { }


  /**
   * Notify host component that a date was clicked
   * @param event
   * @param date
   */
  dateSelected(selectedDate: CalendarMonthViewDay) : void {
    this.selectedMonthViewDate = selectedDate;
    this.onDateClicked.emit(selectedDate.date);

    switch(this.usage) {
      case 'multi-day-chooser':
        // Ignore this selection if it is before today, today, or outside displayed month
        if (selectedDate.isPast || selectedDate.isToday || !selectedDate.inMonth) { break; }

        this.toggleSelectedDates(selectedDate.date, selectedDate);
        this.updateValue();
        break;
      case 'event-schedule':
      case 'overlap-viewer':
        alert('Calender usage "' + this.usage + '" is not implemented. Only "multi-day-chooser" is available.');
        break;
      default:
        alert('Unrecognized calendar usage: ' + this.usage + '. Must be one of "multi-day-chooser", "event-schedule", or "overlap-viewer"');
        break;
    }
  }

  registerOnTouched(fn: Function) { this.onTouch = fn; }
  registerOnChange(fn: Function) { this.onModelChange = fn; }

  /**
   *
   * @param selectedDates
   */
  writeValue(selectedDates: string) {
    if (selectedDates == null || selectedDates == undefined || selectedDates.trim() == '') {
      this.selectedDates = [];
    } else {
      // Trim every date before today
      let today : Date = new Date();
      let parsedDates : string[] = selectedDates.split(';');
      this.selectedDates = parsedDates.filter((date,index,list) => { return (new Date(date)) >= today; });
      
      (this.currentMonthCalendarControl as any).refreshBody();
      (this.nextMonthCalendarControl as any).refreshBody();

    }
  }

  /**
   * 
   * @param selectedDate
   */
  toggleSelectedDates(selectedDate: Date, day: CalendarMonthViewDay) {
    let selectedDateString : string = selectedDate.toISOString();
    if (this.selectedDates.indexOf(selectedDateString) == -1){
      // Not in the list, lets add it
      this.selectedDates.push(selectedDateString);
      day.cssClass = 'selected-day';
      this.selectedMonthViewDate = day;
    } else {
      // Its in the list, lets remove it
      let foundIndex : number = this.selectedDates.indexOf(selectedDateString);
      this.selectedDates.splice(foundIndex, 1);
      delete this.selectedMonthViewDate.cssClass;
    }
  }

  /**
   * Updates the value and trigger changes
   */
  private updateValue() {
      this.value = this.selectedDates.join(';');
      this.onModelChange(this.value);
      this.onTouch();
  }


  beforeMonthViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    let breakpoint: string = '';
    breakpoint += 'l';
    body.forEach(day => {
      if (this.selectedDates.some(selectedDay => selectedDay === day.date.toISOString())) {
        // Ignore this selection if it is before today, today, or outside displayed month
        if (!day.isPast && !day.isToday && day.inMonth) { 
          day.cssClass = 'selected-day';
        }
      }
    });
  }


  /**
   * Validation
   * @param c
   */
  validate(c: FormControl): ValidationErrors | null {
    return null;
  }

}