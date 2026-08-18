import { Component, inject, signal } from '@angular/core';
import { VocabularyStore } from '../../store/vocabulary.store';
import { PhraseComponent } from '../phrase/phrase.component';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';

@Component({
    selector: 'app-dashboard',
    imports: [PhraseComponent, VocabularyListComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
    vocabularyStore = inject(VocabularyStore);
    focusedList = signal<'review' | 'new' | null>(null);

    setFocusMode(list: 'review' | 'new', enabled: boolean) {
        this.focusedList.set(enabled ? list : null);
    }
}
