import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TranslatedPhrase } from '../../types/types';

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

    getAudio(id: number) {
        return this.http.get(`${this.baseUrl}/audio/${id}.mp3`, {
            responseType: 'text',
        });
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

    markAsLearned(id: string): Observable<TranslatedPhrase> {
        return this.http.patch<TranslatedPhrase>(
            `${this.apiBaseUrl}/${id}/learned`,
            {
                learned: true,
            },
        );
    }
}
