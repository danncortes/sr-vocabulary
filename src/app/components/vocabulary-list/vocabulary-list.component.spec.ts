import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { VocabularyListComponent } from './vocabulary-list.component';
import { PhraseComponent } from '../phrase/phrase.component';
import { TranslatedPhrase } from '../../types/types';
import { VocabularyStore } from '../../store/vocabulary.store';
import { OptionsMenuComponent } from '../options-menu/options-menu.component';

// Test Host Component
@Component({
    standalone: true,
    imports: [VocabularyListComponent, PhraseComponent],
    template: `
        <app-vocabulary-list
            [vocabulary]="vocabulary()"
            [title]="title()"
            [showSelectToggle]="showSelectToggle()"
            [statusText]="statusText()"
            [status]="status()"
        >
            <ng-template
                #phrase
                let-translatedPhrase="translatedPhrase"
                let-showSelectCheckbox="showSelectCheckbox"
                let-selectedChange="selectedChange"
                let-isSelected="isSelected"
            >
                <app-phrase
                    [translatedPhrase]="translatedPhrase"
                    [showSelectCheckbox]="true"
                    [isSelected]="isSelected"
                    (selectedChange)="selectedChange($event)"
                ></app-phrase>
            </ng-template>
        </app-vocabulary-list>
    `,
})
class TestHostComponent {
    vocabulary = signal<TranslatedPhrase[]>([]);
    title = signal<string>('');
    showSelectToggle = signal<boolean>(true);
    statusText = signal<string>('');
    status = signal<number>(0);
    @ViewChild('phrase', { static: true })
    phraseTemplate!: TemplateRef<unknown>;
}

describe('VocabularyListComponent within a host', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;
    let mockVocabularyStore: Partial<VocabularyStore>;
    const mockVocabulary: TranslatedPhrase[] = [
        {
            id: 1,
            original: { id: 1, text: 'Hello', audio_url: '' },
            translated: { id: 2, text: 'Hola', audio_url: '' },
            sr_stage_id: 1,
            review_date: '',
            modified_at: '',
            priority: 1,
            learned: 0,
        },
        {
            id: 2,
            original: { id: 3, text: 'World', audio_url: '' },
            translated: { id: 4, text: 'Mundo', audio_url: '' },
            sr_stage_id: 1,
            review_date: '',
            modified_at: '',
            priority: 1,
            learned: 0,
        },
    ];

    beforeEach(async () => {
        mockVocabularyStore = {
            getAudio: jasmine.createSpy().and.returnValue(of('audio-url')),
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
        };

        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
            ],
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it('should create', () => {
        expect(hostComponent).toBeTruthy();
    });

    it('should render the correct number of phrase components', async () => {
        hostComponent.vocabulary.set(mockVocabulary);
        hostFixture.detectChanges();

        const phraseComponents = hostFixture.debugElement.queryAll(
            By.directive(PhraseComponent),
        );
        expect(phraseComponents.length).toBe(mockVocabulary.length);
    });

    it('show render "There is no vocabulary to show" when there are no phrases', () => {
        hostComponent.vocabulary.set([]);
        hostFixture.detectChanges();

        const phraseComponents = hostFixture.debugElement.queryAll(
            By.directive(PhraseComponent),
        );
        expect(phraseComponents.length).toBe(0);
        const noPhrasesElement = hostFixture.debugElement.query(
            By.css('.vocabulary-list__no-vocabulary'),
        );
        expect(noPhrasesElement).toBeTruthy();
        expect(noPhrasesElement.nativeElement.textContent.trim()).toEqual(
            'There is no vocabulary to show',
        );
    });

    it('should render the title with the number of phrase elements', () => {
        hostComponent.vocabulary.set(mockVocabulary);
        hostComponent.title.set('Test Title');
        hostFixture.detectChanges();

        const titleElement = hostFixture.debugElement.query(
            By.css('.vocabulary-list-header h2'),
        ).nativeElement;
        expect(titleElement.textContent.trim()).toEqual('Test Title(2)');
    });

    it('should render select toggle', () => {
        hostComponent.vocabulary.set(mockVocabulary);
        hostComponent.showSelectToggle.set(true);
        hostFixture.detectChanges();
        const checkbox = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );
        expect(checkbox).toBeTruthy();
    });

    it('should not render select toggle when vocabulary is empty', () => {
        hostComponent.vocabulary.set([]);
        hostComponent.showSelectToggle.set(true);
        hostFixture.detectChanges();
        const checkbox = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );
        expect(checkbox).toBeFalsy();
    });

    it('should render number of Phrase elements selected', () => {
        hostComponent.vocabulary.set(mockVocabulary);
        hostComponent.showSelectToggle.set(true);
        hostFixture.detectChanges();

        let selectedText = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-label'),
        ).nativeElement;

        expect(selectedText.textContent.trim()).toContain('Select');

        const vocabularyListComponent = hostFixture.debugElement.query(
            By.directive(VocabularyListComponent),
        ).componentInstance;

        const checkbox = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );

        checkbox.nativeElement.click();
        hostFixture.detectChanges();

        selectedText = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-label'),
        ).nativeElement;

        expect(selectedText.textContent.trim()).toContain('0 Selected');

        vocabularyListComponent.selectedChange(mockVocabulary[0].id);
        hostFixture.detectChanges();

        selectedText = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-label'),
        ).nativeElement;

        expect(selectedText.textContent.trim()).toContain('1 Selected');
    });

    it('should render select all button', () => {
        hostComponent.vocabulary.set(mockVocabulary);
        hostComponent.showSelectToggle.set(true);
        hostFixture.detectChanges();

        const checkbox = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );

        checkbox.nativeElement.click();
        hostFixture.detectChanges();

        const button = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-button'),
        );
        expect(button).toBeTruthy();
        expect(button.nativeElement.textContent.trim()).toBe('Select all');
    });

    it('should render deselect all button', () => {
        const vocabularyListComponent = hostFixture.debugElement.query(
            By.directive(VocabularyListComponent),
        ).componentInstance;
        hostComponent.vocabulary.set(mockVocabulary);
        hostFixture.detectChanges();

        vocabularyListComponent.toggleSelect();
        vocabularyListComponent.toggleSelectAllVocabulary();
        hostFixture.detectChanges();

        const button = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-button'),
        );
        expect(button).toBeTruthy();
        expect(button.nativeElement.textContent.trim()).toBe('Deselect all');
    });

    it('should render status text', () => {
        hostComponent.statusText.set('reviewed');
        hostComponent.status.set(5);
        hostFixture.detectChanges();

        const statusContainer = hostFixture.debugElement.queryAll(
            By.css('.vocabulary-list__status'),
        )[0];
        expect(statusContainer.nativeElement.textContent).toContain('5');
        expect(statusContainer.nativeElement.textContent).toContain('reviewed');
    });

    it('should render options menu button', () => {
        const vocabularyListComponent = hostFixture.debugElement.query(
            By.directive(VocabularyListComponent),
        ).componentInstance;
        hostComponent.vocabulary.set(mockVocabulary);
        hostFixture.detectChanges();

        const checkbox = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );

        checkbox.nativeElement.click();
        hostFixture.detectChanges();
        const optionsButton = hostFixture.debugElement.query(
            By.css('.vocabulary-options-menu-button'),
        );
        hostFixture.detectChanges();
        expect(optionsButton).toBeTruthy();
        expect(optionsButton.nativeElement.disabled).toBeTruthy();

        vocabularyListComponent.selectedChange(mockVocabulary[0].id);
        hostFixture.detectChanges();

        expect(optionsButton.nativeElement.disabled).toBeFalsy();
    });

    it('should select and deselect all elements', () => {
        hostComponent.vocabulary.set(mockVocabulary);
        hostFixture.detectChanges();

        const checkbox = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );

        checkbox.nativeElement.click();
        hostFixture.detectChanges();

        const selectButton = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-button'),
        );

        selectButton.nativeElement.click();
        hostFixture.detectChanges();
        const phraseComponents = hostFixture.debugElement.queryAll(
            By.directive(PhraseComponent),
        );

        phraseComponents.forEach((phraseComponent) => {
            const phraseComponentInstance = phraseComponent.componentInstance;
            expect(phraseComponentInstance.isSelected()).toBeTruthy();
        });

        selectButton.nativeElement.click();
        hostFixture.detectChanges();

        phraseComponents.forEach((phraseComponent) => {
            const phraseComponentInstance = phraseComponent.componentInstance;
            expect(phraseComponentInstance.isSelected()).toBeFalsy();
        });
    });

    it('shows spinner and disables options menu while busy, and re-enables after completion', () => {
        hostComponent.vocabulary.set([
            {
                id: 1,
                original: { id: 1, text: 'Hello', audio_url: '' },
                translated: { id: 2, text: 'Hola', audio_url: '' },
                sr_stage_id: 1,
                review_date: '',
                modified_at: '',
                priority: 1,
                learned: 0,
            },
        ]);
        hostFixture.detectChanges();

        const listCmp = hostFixture.debugElement.query(
            By.directive(VocabularyListComponent),
        ).componentInstance;

        // Activate selection UI
        const selectToggle = hostFixture.debugElement.query(
            By.css('.vocabulary-list__select-toggle-checkbox'),
        );
        selectToggle.nativeElement.click();
        hostFixture.detectChanges();

        // Select one id
        listCmp.selectedChange(1);
        hostFixture.detectChanges();

        // Open the menu to render app-options-menu
        const optionsBtn = hostFixture.debugElement.query(
            By.css('.vocabulary-options-menu-button'),
        );
        optionsBtn.nativeElement.click();
        hostFixture.detectChanges();

        // Make delayVocabulary return a controllable observable
        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as jasmine.Spy).and.returnValue(
            delaySubject.asObservable(),
        );

        // Trigger delay action — should set busy
        listCmp.selectDelayDays(7);
        hostFixture.detectChanges();

        // Spinner is visible next to "Options"
        const spinner =
            optionsBtn.nativeElement.querySelector('.loading-spinner');
        expect(spinner).toBeTruthy();

        // app-options-menu receives disabled=true
        const optionsMenuDE = hostFixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );
        expect(optionsMenuDE).toBeTruthy();
        expect(optionsMenuDE.componentInstance.disabled()).toBeTrue();

        // Complete the action to clear busy state
        delaySubject.complete();
        hostFixture.detectChanges();

        // Spinner hidden and disabled=false
        const spinnerAfter =
            optionsBtn.nativeElement.querySelector('.loading-spinner');
        expect(spinnerAfter).toBeFalsy();
        expect(optionsMenuDE.componentInstance.disabled()).toBeFalse();
    });
});
