import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface User {
    id: string;
    email: string;
    name: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
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
}
