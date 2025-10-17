import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OptionsMenuComponent } from './options-menu.component';
import { VocabularyStore } from '../../store/vocabulary.store';

describe('OptionsMenuComponent', () => {
    let component: OptionsMenuComponent;
    let fixture: ComponentFixture<OptionsMenuComponent>;
    let mockVocabularyStore: Partial<VocabularyStore>;

    beforeEach(async () => {
        mockVocabularyStore = {
            getAudio: jasmine.createSpy().and.returnValue(of('audio-url')),
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
        };

        await TestBed.configureTestingModule({
            imports: [OptionsMenuComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OptionsMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
