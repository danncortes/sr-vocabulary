import { CdkMenuTrigger } from '@angular/cdk/menu';
import { WritableSignal } from '@angular/core';
import { Observable, Subscription, finalize } from 'rxjs';
import { VocabularyStore } from '../../store/vocabulary.store';

export abstract class OptionsActionsBase {
    protected vocabularyStore!: VocabularyStore;
    protected busy!: WritableSignal<boolean>;
    protected getTrigger!: () => CdkMenuTrigger | null;
    protected isDeleteConfirmOpen!: WritableSignal<boolean>;

    // Configure dependencies from the child component
    protected configureOptionsActions(deps: {
        vocabularyStore: VocabularyStore;
        busy: WritableSignal<boolean>;
        getTrigger: () => CdkMenuTrigger | null;
        isDeleteConfirmOpen: WritableSignal<boolean>;
    }): void {
        this.vocabularyStore = deps.vocabularyStore;
        this.busy = deps.busy;
        this.getTrigger = deps.getTrigger;
        this.isDeleteConfirmOpen = deps.isDeleteConfirmOpen;
    }

    requestDelete() {
        this.isDeleteConfirmOpen.set(true);
    }

    cancelDelete() {
        this.isDeleteConfirmOpen.set(false);
    }

    delay(ids: number[], days: number, onSuccess?: () => void): Subscription {
        return this.runWithFinalize(
            this.vocabularyStore.delayVocabulary(ids, days),
            onSuccess,
            (error) => console.error('Error delaying vocabulary:', error),
        );
    }

    reset(ids: number[], onSuccess?: () => void): Subscription {
        return this.runWithFinalize(
            this.vocabularyStore.resetVocabulary(ids),
            onSuccess,
            (error) => console.error('Error resetting vocabulary:', error),
        );
    }

    restart(ids: number[], onSuccess?: () => void): Subscription {
        return this.runWithFinalize(
            this.vocabularyStore.restartVocabulary(ids),
            onSuccess,
            (error) => console.error('Error resetting vocabulary:', error),
        );
    }

    confirmDelete(ids: number[], onSuccess?: () => void): Subscription {
        return this.runWithFinalize(
            this.vocabularyStore.deleteVocabulary(ids),
            () => {
                this.isDeleteConfirmOpen.set(false);
                onSuccess?.();
            },
            (error) => console.error('Error deleting vocabulary:', error),
        );
    }

    private runWithFinalize<T>(
        action$: Observable<T>,
        onSuccess?: () => void,
        onError?: (error: unknown) => void,
    ): Subscription {
        this.busy.set(true);
        return action$
            .pipe(
                finalize(() => {
                    this.busy.set(false);
                    this.getTrigger?.()?.close();
                }),
            )
            .subscribe({
                next: () => onSuccess?.(),
                error: (error) => onError?.(error),
            });
    }
}
