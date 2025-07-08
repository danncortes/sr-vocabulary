import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { TranslatedPhrase, TranslatedPhraseBase } from '../types/types';
import { VocabularyService } from '../services/vocabulary/vocabulary.service';
import { of, tap } from 'rxjs';

interface VocabularyState {
    vocabulary: TranslatedPhrase[];
    loading: boolean;
    error: string | null;
    audioDictionary: Record<number, { url: string; timestamp: number }>;
}

const initialState: VocabularyState = {
    vocabulary: [],
    loading: false,
    error: null,
    audioDictionary: {},
};

export const VocabularyStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ vocabulary }) => ({
        totalCount: computed(() => vocabulary().length),
        // New computed signals for filtered vocabularies
        newVocabulary: computed(() =>
            vocabulary().filter((v) => v.sr_stage_id === 0 && v.learned === 0),
        ),
        reviewVocabulary: computed(() =>
            vocabulary().filter((v) => {
                const today = new Date();
                const dateObj = new Date(v.review_date);
                return dateObj <= today && v.sr_stage_id > 0;
            }),
        ),
        restVocabulary: computed(() =>
            vocabulary()
                .filter((v) => {
                    const today = new Date();
                    const dateObj = new Date(v.review_date);
                    return dateObj > today;
                })
                .sort((a, b) => {
                    const dateA = new Date(a.review_date);
                    const dateB = new Date(b.review_date);
                    return dateA.getTime() - dateB.getTime();
                }),
        ),
        startedToday: computed(
            () =>
                vocabulary().filter((v) => {
                    return (
                        v.sr_stage_id === 1 &&
                        new Date(v.modified_at).toISOString().split('T')[0] ===
                            new Date().toISOString().split('T')[0]
                    );
                }).length,
        ),
        reviewedToday: computed(
            () =>
                vocabulary().filter((v) => {
                    return (
                        v.sr_stage_id > 1 &&
                        new Date(v.modified_at).toISOString().split('T')[0] ===
                            new Date().toISOString().split('T')[0]
                    );
                }).length,
        ),
        learnedVocabulary: computed(() =>
            vocabulary().filter((v) => v.learned === 1),
        ),
    })),

    withMethods((store, vocabularyService = inject(VocabularyService)) => ({
        getAllVocabulary() {
            patchState(store, { loading: true });

            vocabularyService
                .getAllVocabulary()
                .pipe(
                    tap({
                        next: (vocabulary) => {
                            patchState(store, {
                                vocabulary,
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
                        const { sr_stage_id, review_date, modified_at } =
                            resp as TranslatedPhraseBase;
                        patchState(store, {
                            vocabulary: store.vocabulary().map((v) =>
                                v.id === id
                                    ? {
                                          ...v,
                                          sr_stage_id,
                                          review_date,
                                          modified_at,
                                      }
                                    : v,
                            ),
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
                            vocabulary: store.vocabulary().map((v) => {
                                const response = resp as TranslatedPhraseBase[];
                                const newVocable = response.find(
                                    (voc) => voc.id === v.id,
                                );
                                if (newVocable) {
                                    return {
                                        ...v,
                                        review_date: newVocable.review_date,
                                        modified_at: newVocable.modified_at,
                                    };
                                }
                                return v;
                            }),
                        });
                    },
                }),
            );
        },
    })),
);

export type VocabularyStore = InstanceType<typeof VocabularyStore>;
