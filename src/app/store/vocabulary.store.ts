import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
    TranslatedPhrase,
    TranslatedPhraseBase,
    LanguageTranslation,
    UserSettings,
    NewVocabulary,
} from '../types/types';
import { VocabularyService } from '../services/vocabulary/vocabulary.service';
import { LanguageService } from '../services/language/language.service';
import { UserService } from '../services/user/user.service';
import { forkJoin, tap } from 'rxjs';
import { ToastService } from '../services/toast/toast.service';

interface VocabularyState {
    sourceVocabulary: TranslatedPhrase[];
    loading: boolean;
    error: string | null;
    languageTranslations: LanguageTranslation[];
    userSettings: UserSettings | null;
    isVocabularyFormOpen: boolean;
    vocabularyToEdit: TranslatedPhrase | null;
}

const initialState: VocabularyState = {
    sourceVocabulary: [],
    loading: false,
    error: null,
    languageTranslations: [],
    userSettings: null,
    isVocabularyFormOpen: false,
    vocabularyToEdit: null,
};

export const VocabularyStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ sourceVocabulary: vocabulary }) => ({
        vocabulary: computed(() => {
            const newVocabulary: TranslatedPhrase[] = [];
            const review: TranslatedPhrase[] = [];
            const rest: TranslatedPhrase[] = [];
            const startedToday: TranslatedPhrase[] = [];
            const reviewedToday: TranslatedPhrase[] = [];
            const learned: TranslatedPhrase[] = [];
            const today = new Date();

            for (const v of vocabulary()) {
                const dateObj = new Date(v.review_date);

                if (v.sr_stage_id === 0) {
                    const hasAudio =
                        v.original.audio_url || v.translated.audio_url;
                    if (hasAudio) {
                        newVocabulary.push(v);
                    }
                } else if (dateObj <= today && v.learned !== 1) {
                    review.push(v);
                } else if (dateObj > today && v.learned === 0) {
                    rest.push(v);
                } else if (v.learned === 1) {
                    learned.push(v);
                }

                const isVocabularyReviewedToday =
                    new Date(v.modified_at).toISOString().split('T')[0] ===
                    new Date().toISOString().split('T')[0];

                if (v.sr_stage_id === 1 && isVocabularyReviewedToday) {
                    startedToday.push(v);
                } else if (v.sr_stage_id > 1 && isVocabularyReviewedToday) {
                    reviewedToday.push(v);
                }
            }

            newVocabulary.sort((a, b) => a.priority - b.priority);

            rest.sort((a, b) => {
                const dateA = new Date(a.review_date);
                const dateB = new Date(b.review_date);
                return dateA.getTime() - dateB.getTime();
            });

            return {
                new: newVocabulary,
                review,
                rest,
                startedToday,
                reviewedToday,
                learned,
            };
        }),
    })),

    withMethods(
        (
            store,
            vocabularyService = inject(VocabularyService),
            languageService = inject(LanguageService),
            userService = inject(UserService),
            toastService = inject(ToastService),
        ) => ({
            // Initialize all app data after login
            initializeAppData() {
                forkJoin({
                    languageTranslations:
                        languageService.getLanguageTranslations(),
                    userSettings: userService.getUserSettings(),
                })
                    .pipe(
                        tap({
                            next: (data) => {
                                patchState(store, {
                                    languageTranslations:
                                        data.languageTranslations,
                                    userSettings: data.userSettings,
                                    error: null,
                                });
                            },
                            error: (error) => {
                                toastService.toast({
                                    message: `Error loading app data: ${
                                        error instanceof HttpErrorResponse
                                            ? error.message
                                            : String(error)
                                    }`,
                                    type: 'error',
                                });
                            },
                        }),
                    )
                    .subscribe();

                // Call getAllVocabulary separately as it doesn't depend on the others
                this.getAllVocabulary();
            },

            getAllVocabulary() {
                patchState(store, { loading: true });

                vocabularyService
                    .getAllVocabulary()
                    .pipe(
                        tap({
                            next: (vocabulary) => {
                                patchState(store, {
                                    sourceVocabulary: vocabulary,
                                    loading: false,
                                    error: null,
                                });
                            },
                            error: (error) => {
                                patchState(store, {
                                    loading: false,
                                    error: error.message,
                                });
                            },
                        }),
                    )
                    .subscribe();
            },

            setReviewedVocabulary(id: number) {
                return vocabularyService.reviewVocabulary(id).pipe(
                    tap({
                        next: (resp) => {
                            const {
                                sr_stage_id,
                                review_date,
                                modified_at,
                                learned,
                            } = resp as TranslatedPhraseBase;
                            patchState(store, {
                                sourceVocabulary: store
                                    .sourceVocabulary()
                                    .map((v) =>
                                        v.id === id
                                            ? {
                                                  ...v,
                                                  sr_stage_id,
                                                  review_date,
                                                  modified_at,
                                                  learned,
                                              }
                                            : v,
                                    ),
                            });

                            toastService.toast({
                                message: `Vocabulary ${id} marked as reviewed`,
                                type: 'success',
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error reviewing vocabulary ${id}: ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },

            delayVocabulary(ids: number[], days: number) {
                return vocabularyService.delayVocabulary(ids, days).pipe(
                    tap({
                        next: (resp) => {
                            patchState(store, {
                                sourceVocabulary: store
                                    .sourceVocabulary()
                                    .map((v) => {
                                        const response =
                                            resp as TranslatedPhraseBase[];
                                        const newVocabulary = response.find(
                                            (voc) => voc.id === v.id,
                                        );
                                        if (newVocabulary) {
                                            return {
                                                ...v,
                                                review_date:
                                                    newVocabulary.review_date,
                                                modified_at:
                                                    newVocabulary.modified_at,
                                            };
                                        }
                                        return v;
                                    }),
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error delaying vocabulary ${ids.join(
                                    ', ',
                                )} by ${days} day(s): ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },

            resetVocabulary(ids: number[]) {
                return vocabularyService.resetVocabulary(ids).pipe(
                    tap({
                        next: (resp) => {
                            patchState(store, {
                                sourceVocabulary: store
                                    .sourceVocabulary()
                                    .map((v) => {
                                        const response =
                                            resp as TranslatedPhraseBase[];
                                        const newVocabulary = response.find(
                                            (voc) => voc.id === v.id,
                                        );
                                        if (newVocabulary) {
                                            return {
                                                ...v,
                                                ...newVocabulary,
                                            };
                                        }
                                        return v;
                                    }),
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error resetting vocabulary ${ids.join(', ')}: ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },

            restartVocabulary(ids: number[]) {
                return vocabularyService.restartVocabulary(ids).pipe(
                    tap({
                        next: (resp) => {
                            patchState(store, {
                                sourceVocabulary: store
                                    .sourceVocabulary()
                                    .map((v) => {
                                        const response =
                                            resp as TranslatedPhraseBase[];
                                        const newVocabulary = response.find(
                                            (voc) => voc.id === v.id,
                                        );
                                        if (newVocabulary) {
                                            return {
                                                ...v,
                                                ...newVocabulary,
                                            };
                                        }
                                        return v;
                                    }),
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error restarting vocabulary ${ids.join(
                                    ', ',
                                )}: ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },
            // Delete vocabulary ids (bulk or single), follow reset/restart pattern
            deleteVocabulary(ids: number[]) {
                return vocabularyService.deleteVocabulary(ids).pipe(
                    tap({
                        next: () => {
                            patchState(store, {
                                sourceVocabulary: store
                                    .sourceVocabulary()
                                    .filter((v) => !ids.includes(v.id)),
                            });
                            toastService.toast({
                                message: `Deleted ${ids.length} vocab item(s)`,
                                type: 'success',
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error deleting vocabulary ${ids.join(', ')}: ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },
            openVocabularyForm() {
                patchState(store, { isVocabularyFormOpen: true }); // Placeholder for actual form opening logic
            },
            closeVocabularyForm() {
                patchState(store, {
                    isVocabularyFormOpen: false,
                    vocabularyToEdit: null,
                });
            },
            editVocabulary(vocabularyId: TranslatedPhrase['id']) {
                patchState(store, {
                    vocabularyToEdit: store
                        .sourceVocabulary()
                        .find((v) => v.id === vocabularyId),
                    isVocabularyFormOpen: true,
                });
            },
            createVocabulary(vocabulary: NewVocabulary) {
                return vocabularyService.saveVocabulary(vocabulary).pipe(
                    tap({
                        next: (resp) => {
                            const createdVocabulary = resp as TranslatedPhrase;
                            patchState(store, {
                                sourceVocabulary: [
                                    ...store.sourceVocabulary(),
                                    createdVocabulary,
                                ],
                            });
                            toastService.toast({
                                message: 'Vocabulary created successfully',
                                type: 'success',
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error creating vocabulary: ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },
            updateVocabulary(vocabulary: {
                vocabularyId: number;
                originalPhrase: { text: string; audioUrl: string };
                translatedPhrase: { text: string; audioUrl: string };
                reviewDate: string | null;
                priority: number;
            }) {
                return vocabularyService.updateVocabulary(vocabulary).pipe(
                    tap({
                        next: (resp) => {
                            const updatedVocabulary = resp as TranslatedPhrase;
                            patchState(store, {
                                sourceVocabulary: store
                                    .sourceVocabulary()
                                    .map((v) =>
                                        v.id === updatedVocabulary.id
                                            ? updatedVocabulary
                                            : v,
                                    ),
                            });
                            toastService.toast({
                                message: 'Vocabulary updated successfully',
                                type: 'success',
                            });
                        },
                        error: (error) => {
                            toastService.toast({
                                message: `Error updating vocabulary: ${
                                    error instanceof HttpErrorResponse
                                        ? error.message
                                        : String(error)
                                }`,
                                type: 'error',
                            });
                        },
                    }),
                );
            },
        }),
    ),
);

export type VocabularyStore = InstanceType<typeof VocabularyStore>;
