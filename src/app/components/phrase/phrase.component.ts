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

    revealTranslation() {
        this.isTranlationVisible.update((value) => !value);
    }

    private audioPlayer: HTMLAudioElement | null = null;

    playAudio(id: number) {
        this.vocabularyStore.getAudio(id).subscribe((audioUrl: string) => {
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
        });
    }

    setReviewedVocabulary(id: number) {
        this.vocabularyStore.setReviewedVocabulary(id);
    }
}
