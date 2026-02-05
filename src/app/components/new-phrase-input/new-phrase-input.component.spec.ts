import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPhraseInputComponent } from './new-phrase-input.component';

describe('NewPhraseInputComponent', () => {
  let component: NewPhraseInputComponent;
  let fixture: ComponentFixture<NewPhraseInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPhraseInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPhraseInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
