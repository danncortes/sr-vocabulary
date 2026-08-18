import {
    Component,
    computed,
    input,
    output,
    ContentChild,
    ElementRef,
    effect,
    HostListener,
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
import { IconComponent } from '../icon/icon.component';
import { AudioService } from '../../services/audio/audio.service';
import { finalize } from 'rxjs';

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
        IconComponent,
    ],
    templateUrl: './vocabulary-list.component.html',
    host: { class: 'block' },
    styleUrls: ['./vocabulary-list.component.css'],
})
export class VocabularyListComponent extends OptionsActionsBase {
    vocabulary = input.required<TranslatedPhrase[]>();
    status = input<number>(0);
    title = input<string>('');
    statusText = input<string>('');
    color = input<string>('');
    showSelectToggle = input<boolean>(true);
    focusModeAvailable = input<boolean>(false);
    focusMode = input<boolean>(false);
    showFocusDelays = input<boolean>(true);
    focusModeChange = output<boolean>();
    isSelectActive = signal(false);
    focusIndex = signal(0);
    focusActionBusy = signal(false);
    focusPhrasesRevealed = signal(false);
    focusDelayOptions = [
        { label: '1d', value: 1 },
        { label: '1w', value: 7 },
        { label: '2w', value: 14 },
        { label: '3w', value: 21 },
        { label: '4w', value: 28 },
    ];
    loadingAudioId = signal<number | null>(null);
    selectedIds: number[] = [];
    optionsMenuTrigger = viewChild('optionsMenuTrigger', {
        read: CdkMenuTrigger,
    });
    detailsElement =
        viewChild<ElementRef<HTMLDetailsElement>>('detailsElement');
    noVocabularyMessage = input<string>('There is no vocabulary to show');
    private audioService = inject(AudioService);
    private lastAutoPlayedOriginalId: number | null = null;

    focusedVocabulary = computed(() => {
        const vocabulary = this.vocabulary();
        if (vocabulary.length === 0) {
            return null;
        }
        return vocabulary[this.focusIndex() % vocabulary.length];
    });

    keepExpandedOnDesktop(event: MouseEvent) {
        if (this.focusMode() || window.innerWidth >= 1024) {
            event.preventDefault();
            this.detailsElement()?.nativeElement.setAttribute('open', '');
        }
    }

    @HostListener('window:resize')
    keepExpandedAfterResize() {
        if (window.innerWidth >= 1024) {
            this.detailsElement()?.nativeElement.setAttribute('open', '');
        }
    }

    toggleFocusMode(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        const enabled = !this.focusMode();
        this.focusIndex.set(0);
        this.focusPhrasesRevealed.set(false);
        this.detailsElement()?.nativeElement.setAttribute('open', '');
        this.focusModeChange.emit(enabled);
    }

    previousFocusItem() {
        const length = this.vocabulary().length;
        if (length > 0) {
            this.focusIndex.update((index) => (index - 1 + length) % length);
            this.focusPhrasesRevealed.set(false);
        }
    }

    nextFocusItem() {
        const length = this.vocabulary().length;
        if (length > 0) {
            this.focusIndex.update((index) => (index + 1) % length);
            this.focusPhrasesRevealed.set(false);
        }
    }

    revealFocusPhrases() {
        this.focusPhrasesRevealed.set(true);
    }

    playFocusAudio(id: number) {
        this.loadingAudioId.set(id);
        this.audioService
            .playAudio(`${id}.mp3`)
            .pipe(finalize(() => this.loadingAudioId.set(null)))
            .subscribe({ error: () => undefined });
    }

    reviewFocusedVocabulary() {
        const vocabulary = this.focusedVocabulary();
        if (!vocabulary || this.focusActionBusy()) {
            return;
        }
        const completedIndex = this.focusIndex();
        this.focusActionBusy.set(true);
        this.vocabularyStore
            .setReviewedVocabulary(vocabulary.id)
            .pipe(finalize(() => this.focusActionBusy.set(false)))
            .subscribe({
                next: () =>
                    this.advanceAfterAction(vocabulary.id, completedIndex),
                error: () => undefined,
            });
    }

    delayFocusedVocabulary(days: number) {
        const vocabulary = this.focusedVocabulary();
        if (!vocabulary || this.focusActionBusy()) {
            return;
        }
        const completedIndex = this.focusIndex();
        this.delay([vocabulary.id], days, () =>
            this.advanceAfterAction(vocabulary.id, completedIndex),
        );
    }

    focusLocaleCode(localeCode: string) {
        return localeCode.split('-')[0].toLowerCase();
    }

    private advanceAfterAction(completedId: number, completedIndex: number) {
        const vocabulary = this.vocabulary();
        if (vocabulary.length === 0) {
            this.focusIndex.set(0);
            return;
        }
        const completedItemIsStillVisible = vocabulary.some(
            (item) => item.id === completedId,
        );
        this.focusIndex.set(
            completedItemIsStillVisible
                ? (completedIndex + 1) % vocabulary.length
                : completedIndex % vocabulary.length,
        );
        this.focusPhrasesRevealed.set(false);
    }

    constructor() {
        super();
        effect(() => {
            const focusMode = this.focusMode();
            const vocabulary = this.focusedVocabulary();

            if (!focusMode) {
                this.lastAutoPlayedOriginalId = null;
                return;
            }

            if (
                this.lastAutoPlayedOriginalId !== vocabulary?.original.id &&
                vocabulary?.original.audio_url
            ) {
                this.lastAutoPlayedOriginalId = vocabulary.original.id;
                this.playFocusAudio(vocabulary.original.id);
            }
        });
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
