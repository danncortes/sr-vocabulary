import {
    Component,
    effect,
    ElementRef,
    inject,
    OnInit,
    viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { VocabularyStore } from '../../store/vocabulary.store';
import { ToastComponent } from '../toast/toast.component';
import { VocabularyFormComponent } from '../vocabulary-form/vocabulary-form.component';
import { IconComponent } from '../icon/icon.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        ToastComponent,
        VocabularyFormComponent,
        IconComponent,
    ],
    templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
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
