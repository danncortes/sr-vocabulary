import { Injectable, signal } from '@angular/core';

export interface Notification {
    message: string;
    type: 'success' | 'error' | 'info';
    duration: number; // Duration in milliseconds
    permanent: boolean; // If true, the notification will not auto-dismiss
}

export type NotificationsDict = Record<number, Notification>;

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    constructor() {}

    notifications = signal<NotificationsDict>({});

    toast(
        options: { message: string } & Partial<Omit<Notification, 'message'>>,
    ) {
        const { permanent } = options;

        const notification: Notification = {
            type: 'info',
            duration: 5000,
            permanent: false,
            ...options,
        };

        const id = Date.now();
        this.notifications.update((current) => ({
            ...current,
            [id]: notification,
        }));

        if (!permanent) {
            setTimeout(() => {
                this.dismiss(id);
            }, notification.duration);
        }
    }

    dismiss(id: number) {
        this.notifications.update((current) => {
            const { [id]: removedNotification, ...rest } = current;
            return rest;
        });
    }
}
