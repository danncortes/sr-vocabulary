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
    locale: {
        id: number;
        locale_code: string;
    };
    text: string;
    audio_url: string;
}

export interface LanguageTranslation {
    id: number;
    language_id: number;
    locale_code: string;
    language_name: string;
}
export interface Language {
    id: number;
    locale_code: string;
}
export interface UserSettings {
    id: number;
    user_id: string;
    system_lang: Language;
    origin_lang: Language;
    learning_lang: Language;
}

export interface VocabularyFormValue {
    originalPhrase: string;
    translatedPhrase: string;
    reviewDate: string | null;
    priority: string;
}

export interface AudioPhrase {
    phrase: string;
    localeCode: string;
}

type NewPhrase = Pick<Phrase, 'text' | 'audio_url'> & { localeId: number };

export interface NewVocabulary {
    originalPhrase: NewPhrase;
    translatedPhrase: NewPhrase;
    reviewDate: Date;
    priority: number;
}
