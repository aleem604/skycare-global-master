import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAssessmentComponent } from './patient-assessment.component';

describe('PatientAssessmentComponent', () => {
  let component: PatientAssessmentComponent;
  let fixture: ComponentFixture<PatientAssessmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientAssessmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
