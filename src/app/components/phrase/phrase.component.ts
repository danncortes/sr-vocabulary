import {
    Component,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { OptionsMenuComponent } from '../options-menu/options-menu.component';
import { TranslatedPhrase } from '../../types/types';
import { VocabularyStore } from './../../store/vocabulary.store';
import { IconComponent } from '../icon/icon.component';
import { finalize } from 'rxjs';
import { OptionsActionsBase } from '../shared/options-actions.base';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';

@Component({
    selector: 'app-phrase',
    standalone: true,
    imports: [
        CdkMenuTrigger,
        CdkMenu,
        OptionsMenuComponent,
        DatePipe,
        IconComponent, // Add this import
        DeleteConfirmModalComponent,
    ],
    templateUrl: './phrase.component.html',
    styleUrl: './phrase.component.css',
})
export class PhraseComponent extends OptionsActionsBase {
    translatedPhrase = input.required<TranslatedPhrase>();
    showSelectCheckbox = input<boolean>(false);
    showReviewDate = input<boolean>(true);
    showStage = input<boolean>(true);
    showMenu = input<boolean>(true);
    showDeleteButton = input<boolean>(false);
    isSelected = input<boolean>(false);
    selectedChange = output<number>();
    optionsMenuTrigger = viewChild('optionsMenuTrigger', {
        read: CdkMenuTrigger,
    });

    isTranlationVisible = signal(false);
    loadingAudioId = signal<number | null>(null);
    isReviewLoading = signal(false);
    // Add delete confirm modal state
    delayOptions = [
        {
            label: '1 Day',
            value: 1,
        },
        {
            label: '1 Week',
            value: 7,
        },
        {
            label: '2 Weeks',
            value: 14,
        },
        {
            label: '3 Weeks',
            value: 21,
        },
        {
            label: '4 Weeks',
            value: 28,
        },
    ];

    private audioPlayer: HTMLAudioElement | null = null;

    toggleSelect() {
        this.selectedChange.emit(this.translatedPhrase().id);
    }

    revealTranslation() {
        this.isTranlationVisible.update((value) => !value);
    }

    playAudio(id: number) {
        this.loadingAudioId.set(id);
        // Fetch the audio fil
        this.vocabularyStore.getAudio(id).subscribe({
            next: (audioUrl: string) => {
                this.loadingAudioId.set(null);
                // Stop any currently playing audio
                if (this.audioPlayer) {
                    this.audioPlayer.pause();
                    this.audioPlayer = null;
                }

                // Create and play the audio
                this.audioPlayer = new Audio(audioUrl);
                this.audioPlayer.play().catch((error) => {
                    console.error('Error playing audio:', error);
                });
            },
            error: (error) => {
                console.error('Error fetching audio:', error);
                this.loadingAudioId.set(null);
            },
            complete: () => {
                this.loadingAudioId.set(null);
            },
        });
    }

    setReviewedVocabulary(id: number) {
        this.isReviewLoading.set(true);
        this.vocabularyStore
            .setReviewedVocabulary(id)
            .pipe(finalize(() => this.isReviewLoading.set(false)))
            .subscribe({
                error: (error) => {
                    console.error('Error setting reviewed vocabulary:', error);
                },
            });
    }

    constructor() {
        super();
        this.configureOptionsActions({
            vocabularyStore: inject(VocabularyStore),
            busy: signal(false),
            getTrigger: () => this.optionsMenuTrigger() ?? null,
            isDeleteConfirmOpen: signal(false),
        });
    }
}
