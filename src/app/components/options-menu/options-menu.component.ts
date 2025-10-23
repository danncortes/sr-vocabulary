import { Component, inject, input, output } from '@angular/core';
import { VocabularyStore } from '../../store/vocabulary.store';

@Component({
    selector: 'app-options-menu',
    imports: [],
    templateUrl: './options-menu.component.html',
    styleUrl: './options-menu.component.css',
})
export class OptionsMenuComponent {
    disabled = input<boolean>(false);
    emitReset = output<void>();
    emitRestart = output<void>();
    emitDelayDays = output<number>();
    emitDelete = output<void>();
    vocabularyStore = inject(VocabularyStore);
    menuOptions = [
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

    resetVocabulary() {
        this.emitReset.emit();
    }

    restartVocabulary() {
        this.emitRestart.emit();
    }

    // Add delete handler that emits to parent
    deleteVocabulary() {
        this.emitDelete.emit();
    }
}
