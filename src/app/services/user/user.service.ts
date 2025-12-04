import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserSettings } from '../../types/types';

interface User {
    id: string;
    email: string;
    name: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}`;
    private currentUser: User | null = null;

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    updateUserProfile(userData: Partial<User>): Observable<User> {
        // Here you would typically make an HTTP request to update user data
        return new Observable((observer) => {
            // Simulate API call
            setTimeout(() => {
                this.currentUser = { ...this.currentUser, ...userData } as User;
                observer.next(this.currentUser);
                observer.complete();
            }, 1000);
        });
    }

    getUserSettings(): Observable<UserSettings> {
        return this.http.get<UserSettings>(`${this.baseUrl}/user/settings`);
    }
}
