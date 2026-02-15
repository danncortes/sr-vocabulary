import { Component, inject } from '@angular/core';
import { VocabularyStore } from '../../store/vocabulary.store';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';
import { PhraseComponent } from '../phrase/phrase.component';

@Component({
    selector: 'app-vocabulary-view',
    standalone: true,
    imports: [VocabularyListComponent, PhraseComponent],
    templateUrl: './vocabulary-view.component.html',
})
export class VocabularyViewComponent {
    vocabularyStore = inject(VocabularyStore);
}
