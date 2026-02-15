import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { VocabularyViewComponent } from './vocabulary-view.component';
import { VocabularyStore } from '../../store/vocabulary.store';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';
import { TranslatedPhrase } from '../../types/types';
import { AudioService } from '../../services/audio/audio.service';

describe('VocabularyViewComponent', () => {
    let component: VocabularyViewComponent;
    let fixture: ComponentFixture<VocabularyViewComponent>;

    const mockLocale = { id: 1, locale_code: 'en-US' };

    const mockVocabulary: TranslatedPhrase[] = [
        {
            id: 1,
            original: {
                id: 1,
                text: 'Hello',
                audio_url: 'audio1.mp3',
                locale: mockLocale,
            },
            translated: {
                id: 2,
                text: 'Hola',
                audio_url: 'audio2.mp3',
                locale: mockLocale,
            },
            sr_stage_id: 0,
            review_date: '',
            modified_at: '',
            priority: 1,
            learned: 0,
        },
        {
            id: 2,
            original: {
                id: 3,
                text: 'World',
                audio_url: 'audio3.mp3',
                locale: mockLocale,
            },
            translated: {
                id: 4,
                text: 'Mundo',
                audio_url: 'audio4.mp3',
                locale: mockLocale,
            },
            sr_stage_id: 1,
            review_date: '',
            modified_at: '',
            priority: 1,
            learned: 0,
        },
        {
            id: 3,
            original: {
                id: 5,
                text: 'House',
                audio_url: 'audio5.mp3',
                locale: mockLocale,
            },
            translated: {
                id: 6,
                text: 'Casa',
                audio_url: 'audio6.mp3',
                locale: mockLocale,
            },
            sr_stage_id: 2,
            review_date: '',
            modified_at: '',
            priority: 1,
            learned: 1,
        },
    ];

    const sourceVocabularySignal = signal<TranslatedPhrase[]>(mockVocabulary);
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        sourceVocabularySignal.set(mockVocabulary);

        const mockVocabularyStore = {
            sourceVocabulary: sourceVocabularySignal,
        };

        mockAudioService = jasmine.createSpyObj('AudioService', ['playAudio']);
        mockAudioService.playAudio.and.returnValue(of(undefined));

        await TestBed.configureTestingModule({
            imports: [VocabularyViewComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VocabularyViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render vocabulary list with all vocabulary', () => {
        const vocabularyList = fixture.debugElement.query(
            By.directive(VocabularyListComponent),
        );

        expect(vocabularyList).toBeTruthy();
        expect(vocabularyList.componentInstance.vocabulary()).toEqual(
            mockVocabulary,
        );
    });

    it('should display "All Vocabulary" title', () => {
        const titleElement = fixture.debugElement.query(
            By.css('.vocabulary-list__title'),
        );

        expect(titleElement).toBeTruthy();
        expect(titleElement.nativeElement.textContent.trim()).toContain(
            'All Vocabulary',
        );
        expect(titleElement.nativeElement.textContent.trim()).toContain('(3)');
    });
});
