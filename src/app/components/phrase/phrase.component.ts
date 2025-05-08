import { VocabularyStore } from './../../store/vocabulary.store';
import { Component, inject, input, signal } from '@angular/core';
import { TranslatedPhrase } from '../../types/types';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-phrase',
    imports: [DatePipe],
    templateUrl: './phrase.component.html',
    styleUrl: './phrase.component.css',
})
export class PhraseComponent {
    translatedPhrase = input.required<TranslatedPhrase>();
    showReviewDate = input<boolean>(true);
    showStage = input<boolean>(true);
    showMenu = input<boolean>(true);
    vocabularyStore = inject(VocabularyStore);
    isTranlationVisible = signal(false);
    loadingAudioId = signal<number | null>(null);
    isReviewLoading = signal(false);

    revealTranslation() {
        this.isTranlationVisible.update((value) => !value);
    }

    private audioPlayer: HTMLAudioElement | null = null;

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
}
