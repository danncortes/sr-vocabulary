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
import { DelayMenuComponent } from '../delay-menu/delay-menu.component';
import { TranslatedPhrase } from '../../types/types';
import { VocabularyStore } from './../../store/vocabulary.store';

@Component({
    selector: 'app-phrase',
    imports: [DatePipe, CdkMenuTrigger, CdkMenu, DelayMenuComponent],
    templateUrl: './phrase.component.html',
    styleUrl: './phrase.component.css',
})
export class PhraseComponent {
    translatedPhrase = input.required<TranslatedPhrase>();
    showSelectCheckbox = input<boolean>(false);
    showReviewDate = input<boolean>(true);
    showStage = input<boolean>(true);
    showMenu = input<boolean>(true);
    isSelected = input<boolean>(false);
    selectedChange = output<number>();
    delayMenuTrigger = viewChild('delayMenuTrigger', { read: CdkMenuTrigger });

    vocabularyStore = inject(VocabularyStore);
    isTranlationVisible = signal(false);
    loadingAudioId = signal<number | null>(null);
    isReviewLoading = signal(false);
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
        // TODO: Implement this method in the store
        this.vocabularyStore.setReviewedVocabulary(id).subscribe({
            error: (error) => {
                console.error('Error setting reviewed vocabulary:', error);
            },
            complete: () => {
                this.isReviewLoading.set(false);
            },
        });
    }

    selectDelayDays(days: number) {
        this.vocabularyStore
            .delayVocabulary([this.translatedPhrase().id], days)
            .subscribe({
                complete: () => {
                    this.delayMenuTrigger()?.close();
                },
                error: (error) => {
                    console.error('Error delaying vocabulary:', error);
                },
            });
    }

    delayVocabulary(id: number, days: number) {
        this.vocabularyStore.delayVocabulary([id], days).subscribe({
            error: (error) => {
                console.error('Error delaying vocabulary:', error);
            },
        });
    }
}
