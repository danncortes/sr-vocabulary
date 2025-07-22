import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayMenuComponent } from './delay-menu.component';
import { of } from 'rxjs';
import { VocabularyStore } from '../../store/vocabulary.store';

describe('DelayMenuComponent', () => {
    let component: DelayMenuComponent;
    let fixture: ComponentFixture<DelayMenuComponent>;
    let mockVocabularyStore: Partial<VocabularyStore>;

    beforeEach(async () => {
        mockVocabularyStore = {
            getAudio: jasmine.createSpy().and.returnValue(of('audio-url')),
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
        };

        await TestBed.configureTestingModule({
            imports: [DelayMenuComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DelayMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
