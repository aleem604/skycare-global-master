import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapTrackingComponent } from './map-tracking.component';

describe('MapTrackingComponent', () => {
  let component: MapTrackingComponent;
  let fixture: ComponentFixture<MapTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
