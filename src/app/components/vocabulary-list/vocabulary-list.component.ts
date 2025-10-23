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
import { OptionsMenuComponent } from '../options-menu/options-menu.component';
import { OptionsActionsBase } from '../shared/options-actions.base';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';

// Add this interface above your component class
@Component({
    selector: 'app-vocabulary-list',
    standalone: true,
    imports: [
        NgTemplateOutlet,
        CdkMenuTrigger,
        OptionsMenuComponent,
        CdkMenu,
        DeleteConfirmModalComponent,
    ],
    templateUrl: './vocabulary-list.component.html',
})
export class VocabularyListComponent extends OptionsActionsBase {
    vocabulary = input.required<TranslatedPhrase[]>();
    status = input<number>(0);
    title = input<string>('');
    statusText = input<string>('');
    color = input<string>('');
    showSelectToggle = input<boolean>(true);
    isSelectActive = signal(false);
    selectedIds: number[] = [];
    optionsMenuTrigger = viewChild('optionsMenuTrigger', {
        read: CdkMenuTrigger,
    });

    constructor() {
        super();
        this.configureOptionsActions({
            vocabularyStore: inject(VocabularyStore),
            busy: signal(false),
            getTrigger: () => this.optionsMenuTrigger() ?? null,
            isDeleteConfirmOpen: signal(false),
        });
    }

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

    delayVocabulary(days: number) {
        if (this.selectedIds.length === 0) {
            return;
        }
        super.delay(this.selectedIds, days, () => {
            this.selectedIds = [];
        });
    }

    resetVocabulary() {
        if (this.selectedIds.length === 0) {
            return;
        }
        super.reset(this.selectedIds, () => {
            this.selectedIds = [];
        });
    }

    restartVocabulary() {
        if (this.selectedIds.length === 0) {
            return;
        }
        super.restart(this.selectedIds, () => {
            this.selectedIds = [];
        });
    }

    deleteVocabulary() {
        if (this.selectedIds.length === 0) {
            return;
        }
        super.confirmDelete(this.selectedIds, () => {
            this.selectedIds = [];
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
