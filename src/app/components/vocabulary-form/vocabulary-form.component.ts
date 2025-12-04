import { Component, computed, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { VocabularyStore } from '../../store/vocabulary.store';

@Component({
    selector: 'app-vocabulary-form',
    imports: [ReactiveFormsModule],
    templateUrl: './vocabulary-form.component.html',
    styleUrl: './vocabulary-form.component.css',
})
export class VocabularyFormComponent {
    vocabularyStore = inject(VocabularyStore);

    vocabularyForm = new FormGroup({
        originalPhrase: new FormControl(''),
        translatedPhrase: new FormControl(''),
        reviewDate: new FormControl<string | null>(null),
        priority: new FormControl<string>('0'),
    });

    isEditMode = computed(() => this.vocabularyStore.vocabularyToEdit());

    constructor() {
        effect(() => {
            const vocabulary = this.vocabularyStore.vocabularyToEdit();
            if (vocabulary) {
                this.vocabularyForm.patchValue({
                    originalPhrase: vocabulary.original.text,
                    translatedPhrase: vocabulary.translated.text,
                    priority: vocabulary.priority.toString(),
                    reviewDate: vocabulary.review_date,
                });
            } else {
                this.vocabularyForm.reset({
                    priority: '0',
                });
            }
        });
    }

    submitForm() {
        const formValue = this.vocabularyForm.value;
        console.log(
            '🚀 ~ VocabularyFormComponent ~ submitForm ~ formValue:',
            formValue,
        );
    }

    cancelForm() {
        this.vocabularyStore.closeVocabularyForm();
    }
}
