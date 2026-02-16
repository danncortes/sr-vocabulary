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

    describe('Filter Controls', () => {
        it('should render filter controls section', () => {
            const filtersSection = fixture.debugElement.query(
                By.css('.vocabulary-filters'),
            );
            expect(filtersSection).toBeTruthy();
        });

        it('should render audio filter dropdown', () => {
            const audioFilter = fixture.debugElement.query(
                By.css('.vocabulary-filters__audio-filter select'),
            );
            expect(audioFilter).toBeTruthy();
        });

        it('should render audio filter with correct options', () => {
            const audioFilter = fixture.debugElement.query(
                By.css('.vocabulary-filters__audio-filter select'),
            );
            const options = audioFilter.queryAll(By.css('option'));

            expect(options.length).toBe(3);
            expect(options[0].nativeElement.value).toBe('all');
            expect(options[0].nativeElement.textContent.trim()).toBe('All');
            expect(options[1].nativeElement.value).toBe('with-audio');
            expect(options[1].nativeElement.textContent.trim()).toBe('With audio');
            expect(options[2].nativeElement.value).toBe('without-audio');
            expect(options[2].nativeElement.textContent.trim()).toBe('Without audio');
        });

        it('should render stage filter dropdown', () => {
            const stageFilter = fixture.debugElement.query(
                By.css('.vocabulary-filters__stage-filter select'),
            );
            expect(stageFilter).toBeTruthy();
        });

        it('should render text search input', () => {
            const textSearch = fixture.debugElement.query(
                By.css('.vocabulary-filters__text-search input'),
            );
            expect(textSearch).toBeTruthy();
            expect(textSearch.nativeElement.placeholder).toBe('Search text...');
        });

        it('should populate stage filter with available stages', () => {
            const stageFilter = fixture.debugElement.query(
                By.css('.vocabulary-filters__stage-filter select'),
            );
            const options = stageFilter.queryAll(By.css('option'));

            expect(options.length).toBe(4);
            expect(options[0].nativeElement.value).toBe('all');
            expect(options[1].nativeElement.textContent.trim()).toBe('0');
            expect(options[2].nativeElement.textContent.trim()).toBe('1');
            expect(options[3].nativeElement.textContent.trim()).toBe('2');
        });

        it('should display "Learned" for stage 6', () => {
            const vocabularyWithStage6: TranslatedPhrase[] = [
                ...mockVocabulary,
                {
                    id: 4,
                    original: {
                        id: 7,
                        text: 'Learned word',
                        audio_url: 'audio.mp3',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 8,
                        text: 'Palabra aprendida',
                        audio_url: 'audio.mp3',
                        locale: mockLocale,
                    },
                    sr_stage_id: 6,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 1,
                },
            ];
            sourceVocabularySignal.set(vocabularyWithStage6);
            fixture.detectChanges();

            const stageFilter = fixture.debugElement.query(
                By.css('.vocabulary-filters__stage-filter select'),
            );
            const options = stageFilter.queryAll(By.css('option'));

            const learnedOption = options.find(
                (opt) => opt.nativeElement.value === '6',
            );
            expect(learnedOption).toBeTruthy();
            expect(learnedOption!.nativeElement.textContent.trim()).toBe('Learned');
        });
    });

    describe('Audio Filter', () => {
        it('should show all vocabulary when audio filter is set to all', () => {
            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(3);
        });

        it('should filter to show only vocabulary with audio', () => {
            const vocabularyWithMixedAudio: TranslatedPhrase[] = [
                ...mockVocabulary,
                {
                    id: 4,
                    original: {
                        id: 7,
                        text: 'NoAudio',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 8,
                        text: 'SinAudio',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    sr_stage_id: 0,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
            ];
            sourceVocabularySignal.set(vocabularyWithMixedAudio);
            fixture.detectChanges();

            component.audioFilter.set('with-audio');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(3);

            const filteredVocab = vocabularyList.componentInstance.vocabulary();
            const hasNoAudioItem = filteredVocab.some(
                (v: TranslatedPhrase) => v.id === 4,
            );
            expect(hasNoAudioItem).toBeFalse();
        });

        it('should filter to show only vocabulary without audio', () => {
            const vocabularyWithMixedAudio: TranslatedPhrase[] = [
                ...mockVocabulary,
                {
                    id: 4,
                    original: {
                        id: 7,
                        text: 'NoAudio',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 8,
                        text: 'SinAudio',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    sr_stage_id: 0,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
            ];
            sourceVocabularySignal.set(vocabularyWithMixedAudio);
            fixture.detectChanges();

            component.audioFilter.set('without-audio');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].id).toBe(4);
        });

        it('should change filter via dropdown selection', () => {
            const vocabularyWithMixedAudio: TranslatedPhrase[] = [
                ...mockVocabulary,
                {
                    id: 4,
                    original: {
                        id: 7,
                        text: 'NoAudio',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 8,
                        text: 'SinAudio',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    sr_stage_id: 0,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
            ];
            sourceVocabularySignal.set(vocabularyWithMixedAudio);
            fixture.detectChanges();

            const audioSelect = fixture.debugElement.query(
                By.css('.vocabulary-filters__audio-filter select'),
            );

            audioSelect.nativeElement.value = 'with-audio';
            audioSelect.nativeElement.dispatchEvent(new Event('change'));
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(3);
        });
    });

    describe('Stage Filter', () => {
        it('should filter vocabulary by stage', () => {
            const stageSelect = fixture.debugElement.query(
                By.css('.vocabulary-filters__stage-filter select'),
            );

            stageSelect.nativeElement.value = '0';
            stageSelect.nativeElement.dispatchEvent(new Event('change'));
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].sr_stage_id).toBe(0);
        });

        it('should show all vocabulary when stage is set to all', () => {
            component.stageFilter.set('1');
            fixture.detectChanges();

            let vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(1);

            component.stageFilter.set('all');
            fixture.detectChanges();

            vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(3);
        });

        it('should filter by stage 6 when selecting Learned option', () => {
            const vocabularyWithStage6: TranslatedPhrase[] = [
                ...mockVocabulary,
                {
                    id: 4,
                    original: {
                        id: 7,
                        text: 'Learned word',
                        audio_url: 'audio.mp3',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 8,
                        text: 'Palabra aprendida',
                        audio_url: 'audio.mp3',
                        locale: mockLocale,
                    },
                    sr_stage_id: 6,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 1,
                },
            ];
            sourceVocabularySignal.set(vocabularyWithStage6);
            fixture.detectChanges();

            component.stageFilter.set('6');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].sr_stage_id).toBe(6);
        });
    });

    describe('Text Search Filter', () => {
        it('should filter vocabulary by original text', () => {
            component.textSearch.set('Hello');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].original.text).toBe('Hello');
        });

        it('should filter vocabulary by translated text', () => {
            component.textSearch.set('Casa');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].translated.text).toBe('Casa');
        });

        it('should be case insensitive', () => {
            component.textSearch.set('hello');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].original.text).toBe('Hello');
        });

        it('should return no results for non-matching text', () => {
            component.textSearch.set('xyz123');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(0);
        });

        it('should filter with partial text match', () => {
            component.textSearch.set('ell');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].original.text).toBe('Hello');
        });
    });

    describe('Combined Filters', () => {
        it('should apply multiple filters together', () => {
            const extendedVocabulary: TranslatedPhrase[] = [
                ...mockVocabulary,
                {
                    id: 4,
                    original: {
                        id: 7,
                        text: 'Hello again',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 8,
                        text: 'Hola de nuevo',
                        audio_url: '',
                        locale: mockLocale,
                    },
                    sr_stage_id: 0,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
            ];
            sourceVocabularySignal.set(extendedVocabulary);
            fixture.detectChanges();

            component.textSearch.set('Hello');
            component.stageFilter.set('0');
            component.audioFilter.set('with-audio');
            fixture.detectChanges();

            const vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            const filteredVocab = vocabularyList.componentInstance.vocabulary();

            expect(filteredVocab.length).toBe(1);
            expect(filteredVocab[0].id).toBe(1);
            expect(filteredVocab[0].original.text).toBe('Hello');
        });

        it('should update filtered results when vocabulary source changes', () => {
            component.stageFilter.set('3');
            fixture.detectChanges();

            let vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(0);

            const newVocabulary: TranslatedPhrase[] = [
                {
                    id: 5,
                    original: {
                        id: 9,
                        text: 'New',
                        audio_url: 'audio.mp3',
                        locale: mockLocale,
                    },
                    translated: {
                        id: 10,
                        text: 'Nuevo',
                        audio_url: 'audio.mp3',
                        locale: mockLocale,
                    },
                    sr_stage_id: 3,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
            ];
            sourceVocabularySignal.set(newVocabulary);
            fixture.detectChanges();

            vocabularyList = fixture.debugElement.query(
                By.directive(VocabularyListComponent),
            );
            expect(vocabularyList.componentInstance.vocabulary().length).toBe(1);
        });
    });

    describe('getStageLabel helper', () => {
        it('should return "Learned" for stage 6', () => {
            expect(component.getStageLabel(6)).toBe('Learned');
        });

        it('should return the stage number as string for other stages', () => {
            expect(component.getStageLabel(0)).toBe('0');
            expect(component.getStageLabel(1)).toBe('1');
            expect(component.getStageLabel(5)).toBe('5');
        });
    });
});
