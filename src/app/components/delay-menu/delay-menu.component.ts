import { Component, inject, output } from '@angular/core';
import { VocabularyStore } from '../../store/vocabulary.store';

@Component({
    selector: 'app-delay-menu',
    imports: [],
    templateUrl: './delay-menu.component.html',
    styleUrl: './delay-menu.component.css',
})
export class DelayMenuComponent {
    emitDelayDays = output<number>();
    vocabularyStore = inject(VocabularyStore);
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

    delayVocabularyToDays(days: number) {
        this.emitDelayDays.emit(days);
    }
}
