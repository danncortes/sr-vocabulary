import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VocabularyStore } from '../../store/vocabulary.store';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';
import { PhraseComponent } from '../phrase/phrase.component';

export type AudioFilter = 'all' | 'with-audio' | 'without-audio';

@Component({
    selector: 'app-vocabulary-view',
    standalone: true,
    imports: [VocabularyListComponent, PhraseComponent, FormsModule],
    templateUrl: './vocabulary-view.component.html',
})
export class VocabularyViewComponent {
    vocabularyStore = inject(VocabularyStore);

    audioFilter = signal<AudioFilter>('all');
    stageFilter = signal<string>('all');
    textSearch = signal('');

    readonly learnedStageId = 6;

    availableStages = computed(() => {
        const stages = new Set<number>();
        for (const vocab of this.vocabularyStore.sourceVocabulary()) {
            stages.add(vocab.sr_stage_id);
        }
        return Array.from(stages).sort((a, b) => a - b);
    });

    filteredVocabulary = computed(() => {
        let vocabulary = this.vocabularyStore.sourceVocabulary();

        const audioFilterValue = this.audioFilter();
        if (audioFilterValue === 'with-audio') {
            vocabulary = vocabulary.filter(
                (v) => v.original.audio_url || v.translated.audio_url,
            );
        } else if (audioFilterValue === 'without-audio') {
            vocabulary = vocabulary.filter(
                (v) => !v.original.audio_url && !v.translated.audio_url,
            );
        }

        const stage = this.stageFilter();
        if (stage !== 'all') {
            vocabulary = vocabulary.filter(
                (v) => v.sr_stage_id === parseInt(stage, 10),
            );
        }

        const searchText = this.textSearch().toLowerCase().trim();
        if (searchText) {
            vocabulary = vocabulary.filter(
                (v) =>
                    v.original.text.toLowerCase().includes(searchText) ||
                    v.translated.text.toLowerCase().includes(searchText),
            );
        }

        return vocabulary;
    });

    getStageLabel(stage: number): string {
        return stage === this.learnedStageId ? 'Learned' : String(stage);
    }
}
