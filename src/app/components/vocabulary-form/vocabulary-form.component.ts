import {
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    OnDestroy,
    signal,
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { VocabularyStore } from '../../store/vocabulary.store';
import { VocabularyService } from '../../services/vocabulary/vocabulary.service';
import { AudioService } from '../../services/audio/audio.service';
import { NewPhraseInputComponent } from '../new-phrase-input/new-phrase-input.component';
import { NewVocabulary, TranslatedPhrase } from '../../types/types';

const NEW_VOCABULARY_STORAGE_KEY = 'newVocabulary';
const EDIT_VOCABULARY_STORAGE_KEY = 'editVocabulary';
const AUTO_TRANSLATION_STORAGE_KEY = 'autoTranslationEnabled';

interface PhraseStorage {
    lang: string;
    audio: string;
    text: string;
}

interface NewVocabularyStorage {
    originalPhrase: PhraseStorage;
    translatedPhrase: PhraseStorage;
}

interface EditVocabularyStorage {
    vocabularyId: number;
    original: {
        originalPhrase: PhraseStorage;
        translatedPhrase: PhraseStorage;
        reviewDate: string | null;
        priority: string;
    };
    new: {
        originalPhrase: PhraseStorage;
        translatedPhrase: PhraseStorage;
        reviewDate: string | null;
        priority: string;
    };
}

@Component({
    selector: 'app-vocabulary-form',
    imports: [ReactiveFormsModule, NewPhraseInputComponent],
    templateUrl: './vocabulary-form.component.html',
    styleUrl: './vocabulary-form.component.css',
})
export class VocabularyFormComponent implements OnDestroy {
    private destroyRef = inject(DestroyRef);
    private vocabularyService = inject(VocabularyService);
    private audioService = inject(AudioService);
    vocabularyStore = inject(VocabularyStore);

    isEditMode = computed(() => this.vocabularyStore.vocabularyToEdit());

    translatingTarget = signal<'original' | 'translated' | null>(null);
    saving = signal(false);
    loadingAudio = signal<'original' | 'translated' | null>(null);
    originalAudioFilename = signal<string | null>(null);
    translatedAudioFilename = signal<string | null>(null);
    autoTranslationEnabled = signal(
        localStorage.getItem(AUTO_TRANSLATION_STORAGE_KEY) !== 'false',
    );
    generatingPhraseFor = signal<'original' | 'translated' | null>(null);

    originalLocale = computed(() => {
        return (
            this.vocabularyStore.vocabularyToEdit()?.original.locale
                .locale_code ||
            this.vocabularyStore.userSettings()?.origin_lang.locale_code
        );
    });

    translatedLocale = computed(() => {
        return (
            this.vocabularyStore.vocabularyToEdit()?.translated.locale
                .locale_code ||
            this.vocabularyStore.userSettings()?.learning_lang.locale_code
        );
    });

    vocabularyForm = new FormGroup({
        originalPhrase: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(2)],
        }),
        translatedPhrase: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(2)],
        }),
        reviewDate: new FormControl<string | null>(null),
        priority: new FormControl('0', { nonNullable: true }),
    });

    constructor() {
        effect(() => {
            const vocabulary = this.vocabularyStore.vocabularyToEdit();
            const isFormOpen = this.vocabularyStore.isVocabularyFormOpen();

            if (!isFormOpen) return;

            this.removeStoredEdit();

            if (vocabulary) {
                // Initialize edit storage with vocabulary data
                this.initializeEditStorage(vocabulary);
                this.vocabularyForm.patchValue(
                    {
                        originalPhrase: vocabulary.original.text,
                        translatedPhrase: vocabulary.translated.text,
                        priority: vocabulary.priority.toString(),
                        reviewDate: vocabulary.review_date,
                    },
                    { emitEvent: false },
                );
                this.originalAudioFilename.set(
                    vocabulary.original.audio_url || null,
                );
                this.translatedAudioFilename.set(
                    vocabulary.translated.audio_url || null,
                );
            } else {
                this.loadFromStorage();
            }
        });

        this.setupAutoTranslation();
        this.setupStoragePersistence();
    }

    private loadFromStorage(): void {
        const storedVocabulary = localStorage.getItem(
            NEW_VOCABULARY_STORAGE_KEY,
        );
        if (storedVocabulary) {
            const data: NewVocabularyStorage = JSON.parse(storedVocabulary);
            this.vocabularyForm.patchValue(
                {
                    originalPhrase: data.originalPhrase?.text || '',
                    translatedPhrase: data.translatedPhrase?.text || '',
                    priority: '0',
                },
                { emitEvent: false },
            );
            this.originalAudioFilename.set(data.originalPhrase?.audio || null);
            this.translatedAudioFilename.set(
                data.translatedPhrase?.audio || null,
            );
        } else {
            this.initializeStorage();
            this.vocabularyForm.reset({ priority: '0' }, { emitEvent: false });
        }
    }

    private initializeStorage(): void {
        const initialData: NewVocabularyStorage = {
            originalPhrase: { lang: '', audio: '', text: '' },
            translatedPhrase: { lang: '', audio: '', text: '' },
        };
        localStorage.setItem(
            NEW_VOCABULARY_STORAGE_KEY,
            JSON.stringify(initialData),
        );
    }

    private getNewAudioFilesToDelete(
        editData: EditVocabularyStorage,
    ): string[] {
        const filenames: string[] = [];

        if (
            editData.new.originalPhrase.audio &&
            editData.new.originalPhrase.audio !==
                editData.original.originalPhrase.audio
        ) {
            filenames.push(editData.new.originalPhrase.audio);
        }
        if (
            editData.new.translatedPhrase.audio &&
            editData.new.translatedPhrase.audio !==
                editData.original.translatedPhrase.audio
        ) {
            filenames.push(editData.new.translatedPhrase.audio);
        }

        return filenames;
    }

    private initializeEditStorage(vocabulary: TranslatedPhrase): void {
        const phraseData = {
            originalPhrase: {
                lang: vocabulary.original.locale.locale_code,
                audio: vocabulary.original.audio_url || '',
                text: vocabulary.original.text,
            },
            translatedPhrase: {
                lang: vocabulary.translated.locale.locale_code,
                audio: vocabulary.translated.audio_url || '',
                text: vocabulary.translated.text,
            },
            reviewDate: vocabulary.review_date,
            priority: vocabulary.priority.toString(),
        };

        const editData: EditVocabularyStorage = {
            vocabularyId: vocabulary.id,
            original: { ...phraseData },
            new: { ...phraseData },
        };
        localStorage.setItem(
            EDIT_VOCABULARY_STORAGE_KEY,
            JSON.stringify(editData),
        );
    }

    private saveToStorage(): void {
        const { originalPhrase, translatedPhrase, reviewDate, priority } =
            this.vocabularyForm.value;

        if (this.isEditMode()) {
            const storedEdit = localStorage.getItem(
                EDIT_VOCABULARY_STORAGE_KEY,
            );
            if (storedEdit) {
                const editData: EditVocabularyStorage = JSON.parse(storedEdit);
                editData.new = {
                    originalPhrase: {
                        lang: this.originalLocale() || '',
                        audio: this.originalAudioFilename() || '',
                        text: originalPhrase || '',
                    },
                    translatedPhrase: {
                        lang: this.translatedLocale() || '',
                        audio: this.translatedAudioFilename() || '',
                        text: translatedPhrase || '',
                    },
                    reviewDate: reviewDate || null,
                    priority: priority || '0',
                };
                localStorage.setItem(
                    EDIT_VOCABULARY_STORAGE_KEY,
                    JSON.stringify(editData),
                );
            }
            return;
        }

        const data: NewVocabularyStorage = {
            originalPhrase: {
                lang: this.originalLocale() || '',
                audio: this.originalAudioFilename() || '',
                text: originalPhrase || '',
            },
            translatedPhrase: {
                lang: this.translatedLocale() || '',
                audio: this.translatedAudioFilename() || '',
                text: translatedPhrase || '',
            },
        };
        localStorage.setItem(NEW_VOCABULARY_STORAGE_KEY, JSON.stringify(data));
    }

    private setupStoragePersistence(): void {
        this.vocabularyForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(500))
            .subscribe(() => {
                this.saveToStorage();
            });
    }

    private setupAutoTranslation(): void {
        this.setupTranslationListener(
            this.vocabularyForm.controls.originalPhrase,
            this.vocabularyForm.controls.translatedPhrase,
            this.originalLocale,
            this.translatedLocale,
            'translated',
        );

        this.setupTranslationListener(
            this.vocabularyForm.controls.translatedPhrase,
            this.vocabularyForm.controls.originalPhrase,
            this.translatedLocale,
            this.originalLocale,
            'original',
        );
    }

    private setupTranslationListener(
        sourceControl: FormControl<string>,
        targetControl: FormControl<string>,
        sourceLocale: () => string | undefined,
        targetLocale: () => string | undefined,
        targetName: 'original' | 'translated',
    ): void {
        sourceControl.valueChanges
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                debounceTime(2000),
                distinctUntilChanged(),
            )
            .subscribe((phrase) => {
                if (!this.autoTranslationEnabled()) return;

                const source = sourceLocale();
                const target = targetLocale();

                if (source && target) {
                    this.translatingTarget.set(targetName);
                    this.vocabularyService
                        .translatePhrase(phrase, source, target)
                        .subscribe({
                            next: (response) => {
                                targetControl.setValue(
                                    response.translatedPhrase,
                                    { emitEvent: false },
                                );
                                this.translatingTarget.set(null);
                                this.saveToStorage();
                            },
                            error: () => {
                                this.translatingTarget.set(null);
                            },
                        });
                }
            });
    }

    onAudioGenerated(filename: string, type: 'original' | 'translated'): void {
        const currentAudio =
            type === 'original'
                ? this.originalAudioFilename()
                : this.translatedAudioFilename();

        // Determine which audio to delete (if any)
        let audioToDelete: string | null = null;

        if (this.isEditMode()) {
            const storedEdit = localStorage.getItem(
                EDIT_VOCABULARY_STORAGE_KEY,
            );
            if (storedEdit) {
                const editData: EditVocabularyStorage = JSON.parse(storedEdit);
                const originalAudio =
                    type === 'original'
                        ? editData.original.originalPhrase.audio
                        : editData.original.translatedPhrase.audio;

                // Only delete if current audio is different from the original
                if (currentAudio && currentAudio !== originalAudio) {
                    audioToDelete = currentAudio;
                }
            }
        } else {
            // New vocabulary mode: delete any previously generated audio
            if (currentAudio) {
                audioToDelete = currentAudio;
            }
        }

        const updateAudio = () => {
            if (type === 'original') {
                this.originalAudioFilename.set(filename);
            } else {
                this.translatedAudioFilename.set(filename);
            }
            this.saveToStorage();
        };

        if (audioToDelete) {
            this.audioService.deleteAudios([audioToDelete]).subscribe({
                next: updateAudio,
                error: updateAudio, // Still update even if delete fails
            });
        } else {
            updateAudio();
        }
    }

    onPlayAudio(filename: string, type: 'original' | 'translated'): void {
        this.loadingAudio.set(type);
        this.audioService.playAudio(filename).subscribe({
            next: () => {
                this.loadingAudio.set(null);
            },
            error: () => {
                this.loadingAudio.set(null);
            },
        });
    }

    onClearAudio(type: 'original' | 'translated'): void {
        const currentAudio =
            type === 'original'
                ? this.originalAudioFilename()
                : this.translatedAudioFilename();

        if (!currentAudio) return;

        if (this.isEditMode()) {
            const storedEdit = localStorage.getItem(
                EDIT_VOCABULARY_STORAGE_KEY,
            );
            if (storedEdit) {
                const editData: EditVocabularyStorage = JSON.parse(storedEdit);
                const originalAudio =
                    type === 'original'
                        ? editData.original.originalPhrase.audio
                        : editData.original.translatedPhrase.audio;

                // Only delete from server if it's different from the original
                if (currentAudio !== originalAudio) {
                    const restoreOriginal = () => {
                        if (type === 'original') {
                            this.originalAudioFilename.set(
                                originalAudio || null,
                            );
                        } else {
                            this.translatedAudioFilename.set(
                                originalAudio || null,
                            );
                        }
                        this.saveToStorage();
                    };

                    this.audioService.deleteAudios([currentAudio]).subscribe({
                        next: restoreOriginal,
                        error: restoreOriginal,
                    });
                }
                // If it's the original audio, do nothing (can't clear original in edit mode)
            }
        } else {
            // New vocabulary mode: delete the audio
            const clearAudio = () => {
                if (type === 'original') {
                    this.originalAudioFilename.set(null);
                } else {
                    this.translatedAudioFilename.set(null);
                }
                this.saveToStorage();
            };

            this.audioService.deleteAudios([currentAudio]).subscribe({
                next: clearAudio,
                error: clearAudio,
            });
        }
    }

    submitForm(): void {
        const { originalPhrase, translatedPhrase, reviewDate, priority } =
            this.vocabularyForm.value;

        this.saving.set(true);

        if (this.isEditMode()) {
            const vocabularyId = this.vocabularyStore.vocabularyToEdit()!.id;
            this.vocabularyStore
                .updateVocabulary({
                    vocabularyId,
                    originalPhrase: {
                        audioUrl: this.originalAudioFilename() || '',
                        text: originalPhrase || '',
                    },
                    translatedPhrase: {
                        audioUrl: this.translatedAudioFilename() || '',
                        text: translatedPhrase || '',
                    },
                    reviewDate: reviewDate || null,
                    priority: Number(priority),
                })
                .subscribe({
                    next: () => {
                        localStorage.removeItem(EDIT_VOCABULARY_STORAGE_KEY);
                        this.vocabularyStore.closeVocabularyForm();
                        this.saving.set(false);
                    },
                    error: () => {
                        this.saving.set(false);
                    },
                });
        } else {
            const localeIdOriginalPhrase =
                this.vocabularyStore.userSettings()?.origin_lang.id;

            const localeIdTranslatedPhrase =
                this.vocabularyStore.userSettings()?.learning_lang.id;

            this.vocabularyStore
                .createVocabulary({
                    originalPhrase: {
                        audioUrl: this.originalAudioFilename() || '',
                        text: originalPhrase,
                        localeId: localeIdOriginalPhrase,
                    },
                    translatedPhrase: {
                        audioUrl: this.translatedAudioFilename() || '',
                        text: translatedPhrase,
                        localeId: localeIdTranslatedPhrase,
                    },
                    reviewDate,
                    priority: Number(priority),
                } as unknown as NewVocabulary)
                .subscribe({
                    next: () => {
                        localStorage.removeItem(NEW_VOCABULARY_STORAGE_KEY);
                        this.vocabularyStore.closeVocabularyForm();
                        this.saving.set(false);
                    },
                    error: () => {
                        this.saving.set(false);
                    },
                });
        }
    }

    cancelForm(): void {
        if (this.isEditMode()) {
            this.removeStoredEdit();
            this.vocabularyForm.reset({ priority: '0' }, { emitEvent: false });
            this.vocabularyStore.closeVocabularyForm();
            return;
        } else {
            // Create mode: delete all generated audio files
            const filenames: string[] = [];

            if (this.originalAudioFilename()) {
                filenames.push(this.originalAudioFilename()!);
            }
            if (this.translatedAudioFilename()) {
                filenames.push(this.translatedAudioFilename()!);
            }

            if (filenames.length > 0) {
                this.audioService.deleteAudios(filenames).subscribe({
                    next: () => {
                        localStorage.removeItem(NEW_VOCABULARY_STORAGE_KEY);
                        this.vocabularyStore.closeVocabularyForm();
                    },
                    error: () => {
                        localStorage.removeItem(NEW_VOCABULARY_STORAGE_KEY);
                        this.vocabularyStore.closeVocabularyForm();
                    },
                });
                return;
            }
            localStorage.removeItem(NEW_VOCABULARY_STORAGE_KEY);
        }

        this.vocabularyStore.closeVocabularyForm();
    }

    resetForm(): void {
        if (this.isEditMode()) {
            // Edit mode: restore original values
            const storedEdit = localStorage.getItem(
                EDIT_VOCABULARY_STORAGE_KEY,
            );
            if (!storedEdit) return;

            const editData: EditVocabularyStorage = JSON.parse(storedEdit);
            const filenames = this.getNewAudioFilesToDelete(editData);

            const restoreOriginalValues = () => {
                this.vocabularyForm.patchValue(
                    {
                        originalPhrase: editData.original.originalPhrase.text,
                        translatedPhrase:
                            editData.original.translatedPhrase.text,
                        priority: editData.original.priority,
                        reviewDate: editData.original.reviewDate,
                    },
                    { emitEvent: false },
                );
                this.originalAudioFilename.set(
                    editData.original.originalPhrase.audio || null,
                );
                this.translatedAudioFilename.set(
                    editData.original.translatedPhrase.audio || null,
                );

                // Reset 'new' to match 'original' in storage
                editData.new = { ...editData.original };
                localStorage.setItem(
                    EDIT_VOCABULARY_STORAGE_KEY,
                    JSON.stringify(editData),
                );
            };

            if (filenames.length > 0) {
                this.audioService.deleteAudios(filenames).subscribe({
                    next: restoreOriginalValues,
                    error: restoreOriginalValues,
                });
            }
            restoreOriginalValues();
        } else {
            // Create mode: clear form and delete generated audios
            const filenames: string[] = [];

            if (this.originalAudioFilename()) {
                filenames.push(this.originalAudioFilename()!);
            }
            if (this.translatedAudioFilename()) {
                filenames.push(this.translatedAudioFilename()!);
            }

            const clearForm = () => {
                this.vocabularyForm.reset(
                    { priority: '0' },
                    { emitEvent: false },
                );
                this.originalAudioFilename.set(null);
                this.translatedAudioFilename.set(null);
                this.initializeStorage();
            };

            if (filenames.length > 0) {
                this.audioService.deleteAudios(filenames).subscribe({
                    next: clearForm,
                    error: clearForm,
                });
            } else {
                clearForm();
            }
        }
    }

    removeStoredEdit(): void {
        // Handle ESC key press during edit mode - clean up new generated audios
        const storedEdit = localStorage.getItem(EDIT_VOCABULARY_STORAGE_KEY);
        if (storedEdit) {
            const editData: EditVocabularyStorage = JSON.parse(storedEdit);
            const filenames = this.getNewAudioFilesToDelete(editData);

            if (filenames.length > 0) {
                firstValueFrom(this.audioService.deleteAudios(filenames));
            }

            localStorage.removeItem(EDIT_VOCABULARY_STORAGE_KEY);
        }
    }

    toggleAutoTranslation(): void {
        const newValue = !this.autoTranslationEnabled();
        this.autoTranslationEnabled.set(newValue);
        localStorage.setItem(AUTO_TRANSLATION_STORAGE_KEY, String(newValue));
    }

    onGeneratePhrase(type: 'original' | 'translated'): void {
        const text =
            type === 'original'
                ? this.vocabularyForm.controls.originalPhrase.value
                : this.vocabularyForm.controls.translatedPhrase.value;

        const locale =
            type === 'original' ? this.originalLocale() : this.translatedLocale();

        if (!text || !locale) return;

        this.generatingPhraseFor.set(type);
        this.vocabularyService.generatePhrase(text, locale).subscribe({
            next: (response) => {
                if (type === 'original') {
                    this.vocabularyForm.controls.originalPhrase.setValue(
                        response.generatedPhrase,
                        { emitEvent: false },
                    );
                } else {
                    this.vocabularyForm.controls.translatedPhrase.setValue(
                        response.generatedPhrase,
                        { emitEvent: false },
                    );
                }
                this.generatingPhraseFor.set(null);
                this.saveToStorage();
            },
            error: () => {
                this.generatingPhraseFor.set(null);
            },
        });
    }

    ngOnDestroy(): void {
        this.removeStoredEdit();
    }
}
