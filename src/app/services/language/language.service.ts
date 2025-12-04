import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageTranslation } from '../../types/types';

@Injectable({
    providedIn: 'root',
})
export class LanguageService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}`;

    getLanguageTranslations(): Observable<LanguageTranslation[]> {
        return this.http.get<LanguageTranslation[]>(
            `${this.baseUrl}/languages/translations`,
        );
    }
}
