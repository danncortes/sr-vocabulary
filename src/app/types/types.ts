export interface TranslatedPhraseBase {
    id: number;
    phrase_id: number;
    translated_phrase_id: number;
    learned: 0 | 1;
    sr_stage_id: number;
    review_date: string;
    modified_at: string;
    priority: number;
}

export interface TranslatedPhrase
    extends Pick<
        TranslatedPhraseBase,
        'id' | 'sr_stage_id' | 'review_date' | 'modified_at' | 'priority'
    > {
    original: Phrase;
    translated: Phrase;
}

export interface Phrase {
    id: number;
    text: string;
    audio_url: string;
}
