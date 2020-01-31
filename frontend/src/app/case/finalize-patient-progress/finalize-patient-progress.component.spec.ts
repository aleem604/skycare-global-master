import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalizePatientProgressComponent } from './finalize-patient-progress.component';

describe('FinalizePatientProgressComponent', () => {
  let component: FinalizePatientProgressComponent;
  let fixture: ComponentFixture<FinalizePatientProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinalizePatientProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinalizePatientProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
