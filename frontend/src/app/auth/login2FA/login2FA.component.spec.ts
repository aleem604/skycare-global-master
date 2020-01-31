import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Login2FAComponent } from './login2FA.component';

describe('Login2FAComponent', () => {
  let component: Login2FAComponent;
  let fixture: ComponentFixture<Login2FAComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Login2FAComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Login2FAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
