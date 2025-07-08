import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayMenuComponent } from './delay-menu.component';

describe('DelayMenuComponent', () => {
  let component: DelayMenuComponent;
  let fixture: ComponentFixture<DelayMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DelayMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelayMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
