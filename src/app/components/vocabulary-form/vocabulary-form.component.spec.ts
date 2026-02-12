import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { VocabularyFormComponent } from './vocabulary-form.component';
import { VocabularyStore } from '../../store/vocabulary.store';
import { VocabularyService } from '../../services/vocabulary/vocabulary.service';
import { AudioService } from '../../services/audio/audio.service';
import { TranslatedPhrase, UserSettings } from '../../types/types';

describe('VocabularyFormComponent', () => {
    let component: VocabularyFormComponent;
    let fixture: ComponentFixture<VocabularyFormComponent>;
    let mockVocabularyStore: {
        vocabularyToEdit: WritableSignal<TranslatedPhrase | null>;
        isVocabularyFormOpen: WritableSignal<boolean>;
        userSettings: WritableSignal<UserSettings | null>;
        closeVocabularyForm: jasmine.Spy;
        createVocabulary: jasmine.Spy;
        updateVocabulary: jasmine.Spy;
    };
    let mockVocabularyService: jasmine.SpyObj<VocabularyService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    const mockUserSettings = {
        id: 1,
        user_id: 'test-user',
        system_lang: { id: 1, locale_code: 'en-US' },
        origin_lang: { id: 1, locale_code: 'es-ES' },
        learning_lang: { id: 2, locale_code: 'en-US' },
    } as UserSettings;

    const mockVocabularyToEdit: TranslatedPhrase = {
        id: 1,
        original: {
            id: 1,
            text: 'Hola',
            audio_url: 'original-audio.mp3',
            locale: { id: 1, locale_code: 'es-ES' },
        },
        translated: {
            id: 2,
            text: 'Hello',
            audio_url: 'translated-audio.mp3',
            locale: { id: 2, locale_code: 'en-US' },
        },
        review_date: '2025-01-15',
        sr_stage_id: 1,
        modified_at: '',
        learned: 0,
        priority: 1,
    } as TranslatedPhrase;

    beforeEach(async () => {
        mockVocabularyStore = {
            vocabularyToEdit: signal<TranslatedPhrase | null>(null),
            isVocabularyFormOpen: signal<boolean>(true),
            userSettings: signal<UserSettings | null>(mockUserSettings),
            closeVocabularyForm: jasmine.createSpy('closeVocabularyForm'),
            createVocabulary: jasmine.createSpy('createVocabulary').and.returnValue(of({})),
            updateVocabulary: jasmine.createSpy('updateVocabulary').and.returnValue(of({})),
        };

        mockVocabularyService = jasmine.createSpyObj('VocabularyService', ['translatePhrase']);
        mockVocabularyService.translatePhrase.and.returnValue(of({ translatedPhrase: 'Translated' }));

        mockAudioService = jasmine.createSpyObj('AudioService', ['generateAudio', 'playAudio', 'deleteAudios']);
        mockAudioService.generateAudio.and.returnValue(of({ filename: 'new-audio.mp3' }));
        mockAudioService.playAudio.and.returnValue(of(undefined));
        mockAudioService.deleteAudios.and.returnValue(of({ deleted: [] }));

        localStorage.removeItem('newVocabulary');
        localStorage.removeItem('editVocabulary');

        await TestBed.configureTestingModule({
            imports: [VocabularyFormComponent, ReactiveFormsModule],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
                { provide: VocabularyService, useValue: mockVocabularyService },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VocabularyFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        localStorage.removeItem('newVocabulary');
        localStorage.removeItem('editVocabulary');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('form initialization', () => {
        it('should have a valid form group', () => {
            expect(component.vocabularyForm).toBeTruthy();
        });

        it('should have originalPhrase form control', () => {
            expect(component.vocabularyForm.controls.originalPhrase).toBeTruthy();
        });

        it('should have translatedPhrase form control', () => {
            expect(component.vocabularyForm.controls.translatedPhrase).toBeTruthy();
        });

        it('should have reviewDate form control', () => {
            expect(component.vocabularyForm.controls.reviewDate).toBeTruthy();
        });

        it('should have priority form control with default value 0', () => {
            expect(component.vocabularyForm.controls.priority.value).toBe('0');
        });
    });

    describe('form validation', () => {
        it('should be invalid when originalPhrase is empty', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            expect(component.vocabularyForm.invalid).toBeTrue();
        });

        it('should be invalid when translatedPhrase is empty', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('');
            expect(component.vocabularyForm.invalid).toBeTrue();
        });

        it('should be invalid when originalPhrase has less than 2 characters', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('H');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            expect(component.vocabularyForm.controls.originalPhrase.hasError('minlength')).toBeTrue();
        });

        it('should be invalid when translatedPhrase has less than 2 characters', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('H');
            expect(component.vocabularyForm.controls.translatedPhrase.hasError('minlength')).toBeTrue();
        });

        it('should be valid with both phrases filled correctly', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            expect(component.vocabularyForm.valid).toBeTrue();
        });
    });

    describe('edit mode', () => {
        it('should return false for isEditMode when vocabularyToEdit is null', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            expect(component.isEditMode()).toBeFalsy();
        });

        it('should return truthy for isEditMode when vocabularyToEdit exists', () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            fixture.detectChanges();
            expect(component.isEditMode()).toBeTruthy();
        });

        it('should display "Edit Vocabulary" title in edit mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            fixture.detectChanges();
            const title = fixture.nativeElement.querySelector('h2');
            expect(title.textContent.trim()).toBe('Edit Vocabulary');
        });

        it('should display "Create Vocabulary" title in create mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            fixture.detectChanges();
            const title = fixture.nativeElement.querySelector('h2');
            expect(title.textContent.trim()).toBe('Create Vocabulary');
        });

        it('should populate form with vocabulary data in edit mode', fakeAsync(() => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            tick();
            fixture.detectChanges();
            expect(component.vocabularyForm.controls.originalPhrase.value).toBe('Hola');
            expect(component.vocabularyForm.controls.translatedPhrase.value).toBe('Hello');
            expect(component.vocabularyForm.controls.priority.value).toBe('1');
        }));
    });

    describe('locale computation', () => {
        it('should get originalLocale from userSettings in create mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            expect(component.originalLocale()).toBe('es-ES');
        });

        it('should get translatedLocale from userSettings in create mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            expect(component.translatedLocale()).toBe('en-US');
        });

        it('should get originalLocale from vocabulary in edit mode', fakeAsync(() => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            tick();
            fixture.detectChanges();
            expect(component.originalLocale()).toBe('es-ES');
        }));

        it('should get translatedLocale from vocabulary in edit mode', fakeAsync(() => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            tick();
            fixture.detectChanges();
            expect(component.translatedLocale()).toBe('en-US');
        }));
    });

    describe('onAudioGenerated', () => {
        it('should set originalAudioFilename for original type', () => {
            component.onAudioGenerated('new-original.mp3', 'original');
            expect(component.originalAudioFilename()).toBe('new-original.mp3');
        });

        it('should set translatedAudioFilename for translated type', () => {
            component.onAudioGenerated('new-translated.mp3', 'translated');
            expect(component.translatedAudioFilename()).toBe('new-translated.mp3');
        });

        it('should delete previous audio in create mode', fakeAsync(() => {
            component.originalAudioFilename.set('old-audio.mp3');
            component.onAudioGenerated('new-audio.mp3', 'original');
            tick();
            expect(mockAudioService.deleteAudios).toHaveBeenCalledWith(['old-audio.mp3']);
        }));
    });

    describe('onPlayAudio', () => {
        it('should set loadingAudio for original type and reset after complete', fakeAsync(() => {
            const playSubject = new Subject<void>();
            mockAudioService.playAudio.and.returnValue(playSubject.asObservable());

            component.onPlayAudio('test.mp3', 'original');
            expect(component.loadingAudio()).toBe('original');

            playSubject.next();
            playSubject.complete();
            tick();
            expect(component.loadingAudio()).toBeNull();
        }));

        it('should set loadingAudio for translated type and reset after complete', fakeAsync(() => {
            const playSubject = new Subject<void>();
            mockAudioService.playAudio.and.returnValue(playSubject.asObservable());

            component.onPlayAudio('test.mp3', 'translated');
            expect(component.loadingAudio()).toBe('translated');

            playSubject.next();
            playSubject.complete();
            tick();
            expect(component.loadingAudio()).toBeNull();
        }));

        it('should call audioService.playAudio', () => {
            component.onPlayAudio('test.mp3', 'original');
            expect(mockAudioService.playAudio).toHaveBeenCalledWith('test.mp3');
        });

        it('should reset loadingAudio after error', fakeAsync(() => {
            mockAudioService.playAudio.and.returnValue(throwError(() => new Error('Play error')));
            component.onPlayAudio('test.mp3', 'original');
            tick();
            expect(component.loadingAudio()).toBeNull();
        }));
    });

    describe('onClearAudio', () => {
        it('should not delete if no audio exists', () => {
            component.originalAudioFilename.set(null);
            component.onClearAudio('original');
            expect(mockAudioService.deleteAudios).not.toHaveBeenCalled();
        });

        it('should delete audio and clear filename in create mode', fakeAsync(() => {
            component.originalAudioFilename.set('test-audio.mp3');
            component.onClearAudio('original');
            tick();
            expect(mockAudioService.deleteAudios).toHaveBeenCalledWith(['test-audio.mp3']);
            expect(component.originalAudioFilename()).toBeNull();
        }));
    });

    describe('submitForm', () => {
        beforeEach(() => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
        });

        describe('create mode', () => {
            it('should set saving to true and reset after complete', fakeAsync(() => {
                const saveSubject = new Subject<{}>();
                mockVocabularyStore.createVocabulary.and.returnValue(saveSubject.asObservable());

                component.submitForm();
                expect(component.saving()).toBeTrue();

                saveSubject.next({});
                saveSubject.complete();
                tick();
                expect(component.saving()).toBeFalse();
            }));

            it('should call createVocabulary on store', () => {
                component.submitForm();
                expect(mockVocabularyStore.createVocabulary).toHaveBeenCalled();
            });

            it('should close form on success', fakeAsync(() => {
                component.submitForm();
                tick();
                expect(mockVocabularyStore.closeVocabularyForm).toHaveBeenCalled();
            }));

            it('should set saving to false on error', fakeAsync(() => {
                mockVocabularyStore.createVocabulary.and.returnValue(throwError(() => new Error('Save error')));
                component.submitForm();
                tick();
                expect(component.saving()).toBeFalse();
            }));

            it('should remove localStorage on success', fakeAsync(() => {
                localStorage.setItem('newVocabulary', JSON.stringify({}));
                component.submitForm();
                tick();
                expect(localStorage.getItem('newVocabulary')).toBeNull();
            }));
        });

        describe('edit mode', () => {
            beforeEach(fakeAsync(() => {
                mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
                tick();
                fixture.detectChanges();
            }));

            it('should call updateVocabulary on store', () => {
                component.submitForm();
                expect(mockVocabularyStore.updateVocabulary).toHaveBeenCalled();
            });

            it('should pass correct vocabulary id', () => {
                component.submitForm();
                const callArgs = mockVocabularyStore.updateVocabulary.calls.mostRecent().args[0];
                expect(callArgs.vocabularyId).toBe(1);
            });

            it('should close form on success', fakeAsync(() => {
                component.submitForm();
                tick();
                expect(mockVocabularyStore.closeVocabularyForm).toHaveBeenCalled();
            }));
        });
    });

    describe('cancelForm', () => {
        describe('create mode', () => {
            it('should close vocabulary form', fakeAsync(() => {
                component.cancelForm();
                tick();
                expect(mockVocabularyStore.closeVocabularyForm).toHaveBeenCalled();
            }));

            it('should delete generated audio files', fakeAsync(() => {
                component.originalAudioFilename.set('audio1.mp3');
                component.translatedAudioFilename.set('audio2.mp3');
                component.cancelForm();
                tick();
                expect(mockAudioService.deleteAudios).toHaveBeenCalledWith(['audio1.mp3', 'audio2.mp3']);
            }));

            it('should remove localStorage', fakeAsync(() => {
                localStorage.setItem('newVocabulary', JSON.stringify({}));
                component.cancelForm();
                tick();
                expect(localStorage.getItem('newVocabulary')).toBeNull();
            }));
        });

        describe('edit mode', () => {
            beforeEach(fakeAsync(() => {
                mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
                tick();
                fixture.detectChanges();
            }));

            it('should reset form', () => {
                component.vocabularyForm.controls.originalPhrase.setValue('Changed');
                component.cancelForm();
                expect(component.vocabularyForm.controls.priority.value).toBe('0');
            });

            it('should close vocabulary form', () => {
                component.cancelForm();
                expect(mockVocabularyStore.closeVocabularyForm).toHaveBeenCalled();
            });
        });
    });

    describe('resetForm', () => {
        describe('create mode', () => {
            it('should reset form to default values', fakeAsync(() => {
                component.vocabularyForm.controls.originalPhrase.setValue('Test');
                component.vocabularyForm.controls.translatedPhrase.setValue('Test');
                component.resetForm();
                tick();
                expect(component.vocabularyForm.controls.originalPhrase.value).toBe('');
                expect(component.vocabularyForm.controls.translatedPhrase.value).toBe('');
            }));

            it('should clear audio filenames', fakeAsync(() => {
                component.originalAudioFilename.set('audio.mp3');
                component.translatedAudioFilename.set('audio2.mp3');
                component.resetForm();
                tick();
                expect(component.originalAudioFilename()).toBeNull();
                expect(component.translatedAudioFilename()).toBeNull();
            }));

            it('should delete audio files', fakeAsync(() => {
                component.originalAudioFilename.set('audio.mp3');
                component.resetForm();
                tick();
                expect(mockAudioService.deleteAudios).toHaveBeenCalledWith(['audio.mp3']);
            }));
        });
    });

    describe('UI elements', () => {
        it('should have cancel button', () => {
            const formButtons = fixture.nativeElement.querySelectorAll('form > div:last-child button[type="button"]');
            expect(formButtons[0].textContent.trim()).toBe('Cancel');
        });

        it('should have reset button', () => {
            const formButtons = fixture.nativeElement.querySelectorAll('form > div:last-child button[type="button"]');
            expect(formButtons[1].textContent.trim()).toBe('Reset');
        });

        it('should have submit button', () => {
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton).toBeTruthy();
        });

        it('should disable submit button when form is invalid', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('');
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBeTrue();
        });

        it('should enable submit button when form is valid', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBeFalse();
        });

        it('should disable submit button when saving', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            component.saving.set(true);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBeTrue();
        });

        it('should show "Saving..." text when saving', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            component.saving.set(true);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.textContent).toContain('Saving...');
        });

        it('should show loading spinner when saving', () => {
            component.saving.set(true);
            fixture.detectChanges();
            const spinner = fixture.nativeElement.querySelector('.loading-spinner');
            expect(spinner).toBeTruthy();
        });

        it('should show "Save" text in create mode', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            component.saving.set(false);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.textContent.trim()).toBe('Save');
        });

        it('should show "Save Changes" text in edit mode', fakeAsync(() => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            tick();
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.textContent.trim()).toBe('Save Changes');
        }));

        it('should have review date input', () => {
            const reviewDateInput = fixture.nativeElement.querySelector('#review-date-input');
            expect(reviewDateInput).toBeTruthy();
            expect(reviewDateInput.type).toBe('date');
        });

        it('should have priority select', () => {
            const prioritySelect = fixture.nativeElement.querySelector('select[formControlName="priority"]');
            expect(prioritySelect).toBeTruthy();
        });

        it('should have priority options 0, 1, 2', () => {
            const options = fixture.nativeElement.querySelectorAll('select[formControlName="priority"] option');
            expect(options.length).toBe(3);
            expect(options[0].value).toBe('0');
            expect(options[1].value).toBe('1');
            expect(options[2].value).toBe('2');
        });
    });

    describe('button interactions', () => {
        it('should call cancelForm when cancel button is clicked', () => {
            spyOn(component, 'cancelForm');
            const formButtons = fixture.nativeElement.querySelectorAll('form > div:last-child button[type="button"]');
            formButtons[0].click();
            expect(component.cancelForm).toHaveBeenCalled();
        });

        it('should call resetForm when reset button is clicked', () => {
            spyOn(component, 'resetForm');
            const formButtons = fixture.nativeElement.querySelectorAll('form > div:last-child button[type="button"]');
            formButtons[1].click();
            expect(component.resetForm).toHaveBeenCalled();
        });

        it('should call submitForm on form submit', () => {
            spyOn(component, 'submitForm');
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('Hello');
            fixture.detectChanges();
            const form = fixture.nativeElement.querySelector('form');
            form.dispatchEvent(new Event('submit'));
            expect(component.submitForm).toHaveBeenCalled();
        });
    });

    describe('signals initialization', () => {
        it('should initialize translatingTarget as null', () => {
            expect(component.translatingTarget()).toBeNull();
        });

        it('should initialize saving as false', () => {
            expect(component.saving()).toBeFalse();
        });

        it('should initialize loadingAudio as null', () => {
            expect(component.loadingAudio()).toBeNull();
        });

        it('should initialize originalAudioFilename as null', () => {
            expect(component.originalAudioFilename()).toBeNull();
        });

        it('should initialize translatedAudioFilename as null', () => {
            expect(component.translatedAudioFilename()).toBeNull();
        });
    });

    describe('ngOnDestroy', () => {
        it('should call removeStoredEdit on destroy', () => {
            spyOn(component, 'removeStoredEdit');
            component.ngOnDestroy();
            expect(component.removeStoredEdit).toHaveBeenCalled();
        });
    });
});
