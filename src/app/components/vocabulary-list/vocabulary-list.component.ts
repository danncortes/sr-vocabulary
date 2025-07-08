import {
    Component,
    input,
    ContentChild,
    TemplateRef,
    signal,
    inject,
    viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatedPhrase } from '../../types/types';
import { VocabularyStore } from '../../store/vocabulary.store';
import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { DelayMenuComponent } from '../delay-menu/delay-menu.component';

// Add this interface above your component class
@Component({
    selector: 'app-vocabulary-list',
    standalone: true,
    imports: [NgTemplateOutlet, CdkMenuTrigger, DelayMenuComponent, CdkMenu],
    templateUrl: './vocabulary-list.component.html',
})
export class VocabularyListComponent {
    vocabularyStore = inject(VocabularyStore);
    vocabulary = input.required<TranslatedPhrase[]>();
    status = input<number>(0);
    title = input<string>('');
    statusText = input<string>('');
    color = input<string>('');
    showSelectToggle = input<boolean>(true);
    isSelectActive = signal(false);
    selectedIds: number[] = [];
    delayMenuTrigger = viewChild('delayMenuTrigger', { read: CdkMenuTrigger });

    @ContentChild('phrase') phrase!: TemplateRef<{
        translatedPhrase: TranslatedPhrase;
        showSelectCheckbox: boolean;
        isSelected: boolean;
        selectedChange: (id: number) => void;
    }>;

    toggleSelect() {
        this.isSelectActive.update((value) => {
            if (value) {
                this.selectedIds = [];
            }
            return !value;
        });
    }

    isSelected(id: number): boolean {
        return this.selectedIds.includes(id);
    }

    selectedChange(id: number) {
        if (!this.selectedIds.includes(id)) {
            this.selectedIds.push(id);
        } else {
            this.selectedIds = this.selectedIds.filter(
                (existingId) => existingId !== id,
            );
        }
    }
    selectDelayDays(days: number) {
        this.vocabularyStore.delayVocabulary(this.selectedIds, days).subscribe({
            next: () => {
                this.selectedIds = [];
                this.delayMenuTrigger()?.close();
            },
            error: (error) => {
                console.error('Error delaying vocabulary:', error);
            },
        });
    }

    toggleSelectAllVocabulary() {
        if (this.selectedIds.length !== this.vocabulary().length) {
            this.selectedIds = this.vocabulary().map((phrase) => phrase.id);
        } else {
            this.selectedIds = [];
        }
    }
}
