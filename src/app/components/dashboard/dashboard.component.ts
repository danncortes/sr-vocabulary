import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { VocabularyStore } from '../../store/vocabulary.store';
import { PhraseComponent } from '../phrase/phrase.component';
import { VocabularyListComponent } from '../vocabulary-list/vocabulary-list.component';

@Component({
    selector: 'app-dashboard',
    imports: [PhraseComponent, VocabularyListComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
    authService = inject(AuthService);
    vocabularyStore = inject(VocabularyStore);

    ngOnInit(): void {
        this.vocabularyStore.getAllVocabulary(); // TODO: Implement this method in the store
    }

    logout() {
        this.authService.logout();
    }
}
