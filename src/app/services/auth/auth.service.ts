import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import {
    createClient,
    type Session,
    type SupabaseClient,
} from '@supabase/supabase-js';
import { from, map, Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly router = inject(Router);
    private readonly supabase: SupabaseClient | null;
    private session: Session | null = null;
    private initialization: Promise<boolean> | null = null;

    constructor() {
        this.supabase = this.createBrowserClient();
        this.supabase?.auth.onAuthStateChange((_event, session) => {
            this.session = session;
        });
    }

    async signInWithGoogle(): Promise<void> {
        const supabase = this.requireClient();
        const redirectTo = new URL('auth/callback', document.baseURI).toString();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
        });

        if (error) {
            throw error;
        }
    }

    async completeOAuthSignIn(): Promise<void> {
        const authenticated = await this.initializeSession();
        if (!authenticated) {
            throw new Error('Unable to complete sign-in with Google.');
        }

        await this.router.navigate(['/dashboard']);
    }

    initializeSession(): Promise<boolean> {
        if (!this.supabase) {
            return Promise.resolve(false);
        }

        if (!this.initialization) {
            this.initialization = this.supabase.auth
                .getSession()
                .then(async ({ data, error }) => {
                    if (error) {
                        this.session = null;
                        return false;
                    }
                    this.session = data.session;
                    return Boolean(this.session?.access_token);
                })
                .finally(() => {
                    this.initialization = null;
                });
        }

        return this.initialization;
    }

    async logout(): Promise<void> {
        this.session = null;
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        await this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return this.session?.access_token ?? null;
    }

    refreshToken(): Observable<{
        access_token: string;
        refresh_token: string;
    } | null> {
        if (!this.supabase) {
            return of(null);
        }

        return from(this.supabase.auth.refreshSession()).pipe(
            map(({ data, error }) => {
                if (error || !data.session) {
                    void this.logout();
                    return null;
                }

                this.session = data.session;
                return {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                };
            }),
        );
    }

    private createBrowserClient(): SupabaseClient | null {
        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }

        if (
            environment.supabaseUrl.startsWith('__') ||
            environment.supabasePublishableKey.startsWith('__')
        ) {
            return null;
        }

        return createClient(
            environment.supabaseUrl,
            environment.supabasePublishableKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    flowType: 'implicit',
                },
            },
        );
    }

    private requireClient(): SupabaseClient {
        if (!this.supabase) {
            throw new Error(
                'The Supabase URL and publishable key are not configured.',
            );
        }
        return this.supabase;
    }
}
