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
        | 'id'
        | 'sr_stage_id'
        | 'review_date'
        | 'modified_at'
        | 'priority'
        | 'learned'
    > {
    original: Phrase;
    translated: Phrase;
}

export interface Phrase {
    id: number;
    text: string;
    audio_url: string;
}

export interface LanguageTranslation {
    id: number;
    language_id: number;
    locale_code: string;
    language_name: string;
}

export interface UserSettings {
    id: number;
    user_id: string;
    system_lang_id: number;
    origin_lang_id: number;
    learning_lang_id: number;
}
