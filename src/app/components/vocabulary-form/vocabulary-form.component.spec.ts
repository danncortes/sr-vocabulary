import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VocabularyFormComponent } from './vocabulary-form.component';

describe('VocabularyFormComponent', () => {
  let component: VocabularyFormComponent;
  let fixture: ComponentFixture<VocabularyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VocabularyFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VocabularyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
