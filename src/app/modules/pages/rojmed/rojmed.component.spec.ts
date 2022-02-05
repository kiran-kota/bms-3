import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RojmedComponent } from './rojmed.component';

describe('RojmedComponent', () => {
  let component: RojmedComponent;
  let fixture: ComponentFixture<RojmedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RojmedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RojmedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
