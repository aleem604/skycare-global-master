import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EscortProfileComponent } from './escort-profile.component';

describe('EscortProfileComponent', () => {
  let component: EscortProfileComponent;
  let fixture: ComponentFixture<EscortProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EscortProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EscortProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
