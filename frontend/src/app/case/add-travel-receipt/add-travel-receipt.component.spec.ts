import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTravelReceiptComponent } from './add-travel-receipt.component';

describe('AddTravelReceiptComponent', () => {
  let component: AddTravelReceiptComponent;
  let fixture: ComponentFixture<AddTravelReceiptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTravelReceiptComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTravelReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
