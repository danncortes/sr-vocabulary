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
    private apiUrl = `${environment.apiUrl}/vocabulary`;
    private baseUrl = `${environment.apiUrl}`;

    getAllVocabulary(): Observable<TranslatedPhrase[]> {
        return this.http.get<TranslatedPhrase[]>(`${this.apiUrl}`);
    }

    getAudio(id: number) {
        return this.http.get(`${this.baseUrl}/audio/${id}.mp3`, {
            responseType: 'text',
        });
    }

    reviewVocabulary(id: number) {
        return this.http.post(`${this.apiUrl}/review`, {
            id,
        });
    }

    delayVocabulary(ids: number[], days: number) {
        return this.http.post(`${this.apiUrl}/delay`, {
            ids,
            days,
        });
    }

    markAsLearned(id: string): Observable<TranslatedPhrase> {
        return this.http.patch<TranslatedPhrase>(
            `${this.apiUrl}/${id}/learned`,
            {
                learned: true,
            },
        );
    }
}
