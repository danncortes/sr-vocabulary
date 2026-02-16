import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NewVocabulary, TranslatedPhrase } from '../../types/types';

@Injectable({
    providedIn: 'root',
})
export class VocabularyService {
    private http = inject(HttpClient);
    private apiBaseUrl = `${environment.apiBaseUrl}/vocabulary`;
    private baseUrl = `${environment.apiBaseUrl}`;

    getAllVocabulary(): Observable<TranslatedPhrase[]> {
        return this.http.get<TranslatedPhrase[]>(`${this.apiBaseUrl}`);
    }

    reviewVocabulary(id: number) {
        return this.http.post(`${this.apiBaseUrl}/review`, {
            id,
        });
    }

    delayVocabulary(ids: number[], days: number) {
        return this.http.post(`${this.apiBaseUrl}/delay`, {
            ids,
            days,
        });
    }

    resetVocabulary(ids: number[]) {
        return this.http.post(`${this.apiBaseUrl}/reset`, {
            ids,
        });
    }

    restartVocabulary(ids: number[]) {
        return this.http.post(`${this.apiBaseUrl}/restart`, {
            ids,
        });
    }

    // Add delete API call
    deleteVocabulary(ids: number[]) {
        return this.http.post(`${this.apiBaseUrl}/delete`, {
            ids,
        });
    }

    markAsLearned(id: string): Observable<TranslatedPhrase> {
        return this.http.patch<TranslatedPhrase>(
            `${this.apiBaseUrl}/${id}/learned`,
            {
                learned: true,
            },
        );
    }

    saveVocabulary(vocabulary: NewVocabulary) {
        return this.http.post(`${this.apiBaseUrl}/create`, {
            vocabulary,
        });
    }

    updateVocabulary(vocabulary: {
        vocabularyId: number;
        originalPhrase: { text: string; audioUrl: string };
        translatedPhrase: { text: string; audioUrl: string };
        reviewDate: string | null;
        priority: number;
    }) {
        return this.http.post(`${this.apiBaseUrl}/update`, {
            vocabulary,
        });
    }

    translatePhrase(
        phrase: string,
        sourceLanguage: string,
        targetLanguage: string,
    ): Observable<{ translatedPhrase: string }> {
        return this.http.post<{ translatedPhrase: string }>(
            `${this.baseUrl}/translate`,
            {
                phrase,
                sourceLanguage,
                targetLanguage,
            },
        );
    }

    generatePhrase(
        text: string,
        locale: string,
    ): Observable<{ generatedPhrase: string }> {
        return this.http.post<{ generatedPhrase: string }>(
            `${this.apiBaseUrl}/generate`,
            {
                text,
                locale,
            },
        );
    }
}
