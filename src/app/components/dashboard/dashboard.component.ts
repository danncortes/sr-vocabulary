import {
    Component,
    effect,
    ElementRef,
    inject,
    OnInit,
    viewChild,
} from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { VocabularyStore } from '../../store/vocabulary.store';
import { PhraseComponent } from '../phrase/phrase.component';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';
import { ToastComponent } from '../toast/toast.component';
import { VocabularyFormComponent } from '../vocabulary-form/vocabulary-form.component';

@Component({
    selector: 'app-dashboard',
    imports: [
        PhraseComponent,
        VocabularyListComponent,
        ToastComponent,
        VocabularyFormComponent,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
    authService = inject(AuthService);
    vocabularyStore = inject(VocabularyStore);
    vocabularyFormModal = viewChild<ElementRef<HTMLDialogElement>>(
        'vocabularyFormModal',
    );

    constructor() {
        effect(() => {
            const isVocabularyFormOpen =
                this.vocabularyStore.isVocabularyFormOpen();

            const modal = this.vocabularyFormModal();
            if (modal) {
                if (isVocabularyFormOpen) {
                    modal.nativeElement.showModal();
                } else {
                    modal.nativeElement.close();
                }
            }
        });
    }

    ngOnInit(): void {
        this.vocabularyStore.initializeAppData();
    }

    logout() {
        this.authService.logout();
    }

    openVocabularyForm() {
        this.vocabularyStore.openVocabularyForm();
    }

    onModalClose() {
        this.vocabularyStore.closeVocabularyForm();
    }
}
