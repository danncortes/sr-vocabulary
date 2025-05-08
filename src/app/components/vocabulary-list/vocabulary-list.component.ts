import { Component, input, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatedPhrase } from '../../types/types';

@Component({
    selector: 'app-vocabulary-list',
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: './vocabulary-list.component.html',
})
export class VocabularyListComponent {
    vocabulary = input.required<TranslatedPhrase[]>();
    status = input<number>(0);
    title = input<string>('');
    statusText = input<string>('');
    color = input<string>('');
    @ContentChild('phrase') phrase!: TemplateRef<{
        translatedPhrase: TranslatedPhrase;
    }>;
}
