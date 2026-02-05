import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AudioCacheEntry {
    url: string;
    timestamp: number;
}

@Injectable({
    providedIn: 'root',
})
export class AudioService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/audio`;
    private audioCache = new Map<string, AudioCacheEntry>();
    private readonly CACHE_DURATION_MS = 55000; // 55 seconds (signed URLs expire at 60s)
    private audioPlayer: HTMLAudioElement | null = null;

    generateAudio(text: string): Observable<{ filename: string }> {
        return this.http.post<{ filename: string }>(
            `${this.baseUrl}/generate`,
            {
                text,
            },
        );
    }

    getAudioUrl(filename: string): Observable<string> {
        const cached = this.audioCache.get(filename);
        const now = Date.now();

        if (cached && now - cached.timestamp < this.CACHE_DURATION_MS) {
            return of(cached.url);
        }

        return this.http
            .get(`${this.baseUrl}/${filename}`, {
                responseType: 'text',
            })
            .pipe(
                tap((url) => {
                    this.audioCache.set(filename, { url, timestamp: now });
                }),
            );
    }

    playAudio(filename: string): Observable<void> {
        return new Observable((observer) => {
            this.getAudioUrl(filename).subscribe({
                next: (audioUrl) => {
                    if (this.audioPlayer) {
                        this.audioPlayer.pause();
                        this.audioPlayer = null;
                    }

                    this.audioPlayer = new Audio(audioUrl);
                    this.audioPlayer
                        .play()
                        .then(() => {
                            observer.next();
                            observer.complete();
                        })
                        .catch((error) => {
                            console.error('Error playing audio:', error);
                            observer.error(error);
                        });
                },
                error: (error) => {
                    console.error('Error fetching audio:', error);
                    observer.error(error);
                },
            });
        });
    }

    stopAudio(): void {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
    }

    deleteAudios(filenames: string[]): Observable<{ deleted: string[] }> {
        return this.http.post<{ deleted: string[] }>(
            `${this.baseUrl}/delete`,
            { filenames },
        );
    }
}
