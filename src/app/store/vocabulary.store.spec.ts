import { TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { VocabularyStore } from './vocabulary.store';
import { TranslatedPhrase } from '../types/types';
import { environment } from '../../environments/environment';

describe('VocabularyStore', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let store: InstanceType<typeof VocabularyStore>;
    let httpMock: HttpTestingController;

    const mockLocale = { id: 1, locale_code: 'en-US' };
    const apiUrl = `${environment.apiBaseUrl}/vocabulary`;

    const createVocabulary = (
        id: number,
        srStageId: number,
        originalAudioUrl: string,
        translatedAudioUrl: string,
    ): TranslatedPhrase => ({
        id,
        original: {
            id: id * 2,
            text: `Original ${id}`,
            audio_url: originalAudioUrl,
            locale: mockLocale,
        },
        translated: {
            id: id * 2 + 1,
            text: `Translated ${id}`,
            audio_url: translatedAudioUrl,
            locale: mockLocale,
        },
        sr_stage_id: srStageId,
        review_date: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        priority: 1,
        learned: 0,
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [VocabularyStore],
        });

        store = TestBed.inject(VocabularyStore);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(store).toBeTruthy();
    });

    describe('vocabulary computed - newVocabulary filter', () => {
        it('should include new vocabulary with original audio_url', async () => {
            const vocabWithOriginalAudio = createVocabulary(
                1,
                0,
                'audio.mp3',
                '',
            );

            store.getAllVocabulary();
            await vi.advanceTimersByTimeAsync(0);

            const req = httpMock.expectOne(apiUrl);
            req.flush([vocabWithOriginalAudio]);

            const result = store.vocabulary();
            expect(result.new).toContain(vocabWithOriginalAudio);
        });

        it('should include new vocabulary with translated audio_url', async () => {
            const vocabWithTranslatedAudio = createVocabulary(
                2,
                0,
                '',
                'audio.mp3',
            );

            store.getAllVocabulary();
            await vi.advanceTimersByTimeAsync(0);

            const req = httpMock.expectOne(apiUrl);
            req.flush([vocabWithTranslatedAudio]);

            const result = store.vocabulary();
            expect(result.new).toContain(vocabWithTranslatedAudio);
        });

        it('should include new vocabulary with both audio_urls', async () => {
            const vocabWithBothAudios = createVocabulary(
                3,
                0,
                'audio1.mp3',
                'audio2.mp3',
            );

            store.getAllVocabulary();
            await vi.advanceTimersByTimeAsync(0);

            const req = httpMock.expectOne(apiUrl);
            req.flush([vocabWithBothAudios]);

            const result = store.vocabulary();
            expect(result.new).toContain(vocabWithBothAudios);
        });

        it('should exclude new vocabulary when both audio_urls are empty', async () => {
            const vocabWithNoAudio = createVocabulary(4, 0, '', '');

            store.getAllVocabulary();
            await vi.advanceTimersByTimeAsync(0);

            const req = httpMock.expectOne(apiUrl);
            req.flush([vocabWithNoAudio]);

            const result = store.vocabulary();
            expect(result.new).not.toContain(vocabWithNoAudio);
            expect(result.new.length).toBe(0);
        });

        it('should filter new vocabulary correctly with mixed audio states', async () => {
            const vocabWithAudio = createVocabulary(1, 0, 'audio.mp3', '');
            const vocabWithoutAudio = createVocabulary(2, 0, '', '');
            const vocabWithBothAudios = createVocabulary(
                3,
                0,
                'a1.mp3',
                'a2.mp3',
            );

            store.getAllVocabulary();
            await vi.advanceTimersByTimeAsync(0);

            const req = httpMock.expectOne(apiUrl);
            req.flush([vocabWithAudio, vocabWithoutAudio, vocabWithBothAudios]);

            const result = store.vocabulary();
            expect(result.new.length).toBe(2);
            expect(result.new).toContain(vocabWithAudio);
            expect(result.new).toContain(vocabWithBothAudios);
            expect(result.new).not.toContain(vocabWithoutAudio);
        });
    });
});
