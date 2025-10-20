import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatedPhrase, TranslatedPhraseBase } from '../types/types';
import { VocabularyService } from '../services/vocabulary/vocabulary.service';
import { of, tap } from 'rxjs';
import { ToastService } from '../services/toast/toast.service';

interface VocabularyState {
    sourceVocabulary: TranslatedPhrase[];
    loading: boolean;
    error: string | null;
    audioDictionary: Record<number, { url: string; timestamp: number }>;
}

const initialState: VocabularyState = {
    sourceVocabulary: [],
    loading: false,
    error: null,
    audioDictionary: {},
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
                    newVocabulary.push(v);
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
            toastService = inject(ToastService),
        ) => ({
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

            getAudio(id: number) {
                const urlValidDuration = 60000;
                const currentTime = Date.now();
                const { timestamp } = store.audioDictionary()[id] || {
                    timestamp: 0,
                };
                if (timestamp && currentTime - timestamp < urlValidDuration) {
                    return of(store.audioDictionary()[id].url);
                }
                return vocabularyService.getAudio(id).pipe(
                    tap((url) => {
                        patchState(store, {
                            audioDictionary: {
                                ...store.audioDictionary(),
                                [id]: { url, timestamp: currentTime },
                            },
                        });
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
        }),
    ),
);

export type VocabularyStore = InstanceType<typeof VocabularyStore>;
