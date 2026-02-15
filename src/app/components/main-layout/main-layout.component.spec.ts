import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MainLayoutComponent } from './main-layout.component';
import { VocabularyStore } from '../../store/vocabulary.store';
import { AuthService } from '../../services/auth/auth.service';
import { TranslatedPhrase } from '../../types/types';

describe('MainLayoutComponent', () => {
    let component: MainLayoutComponent;
    let fixture: ComponentFixture<MainLayoutComponent>;

    const mockLocale = { id: 1, locale_code: 'en-US' };

    const mockVocabulary: TranslatedPhrase[] = [
        {
            id: 1,
            original: {
                id: 1,
                text: 'Hello',
                audio_url: 'audio1.mp3',
                locale: mockLocale,
            },
            translated: {
                id: 2,
                text: 'Hola',
                audio_url: 'audio2.mp3',
                locale: mockLocale,
            },
            sr_stage_id: 0,
            review_date: '',
            modified_at: '',
            priority: 1,
            learned: 0,
        },
    ];

    const sourceVocabularySignal = signal<TranslatedPhrase[]>(mockVocabulary);
    const loadingSignal = signal<boolean>(false);
    const isVocabularyFormOpenSignal = signal<boolean>(false);
    let initializeAppDataSpy: jasmine.Spy;
    let openVocabularyFormSpy: jasmine.Spy;
    let closeVocabularyFormSpy: jasmine.Spy;
    let logoutSpy: jasmine.Spy;

    beforeEach(async () => {
        sourceVocabularySignal.set(mockVocabulary);
        loadingSignal.set(false);
        isVocabularyFormOpenSignal.set(false);
        initializeAppDataSpy = jasmine.createSpy('initializeAppData');
        openVocabularyFormSpy = jasmine.createSpy('openVocabularyForm');
        closeVocabularyFormSpy = jasmine.createSpy('closeVocabularyForm');
        logoutSpy = jasmine.createSpy('logout');

        const mockVocabularyStore = {
            sourceVocabulary: sourceVocabularySignal,
            loading: loadingSignal,
            isVocabularyFormOpen: isVocabularyFormOpenSignal,
            initializeAppData: initializeAppDataSpy,
            openVocabularyForm: openVocabularyFormSpy,
            closeVocabularyForm: closeVocabularyFormSpy,
        };

        const mockAuthService = {
            logout: logoutSpy,
        };

        await TestBed.configureTestingModule({
            imports: [MainLayoutComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
                { provide: AuthService, useValue: mockAuthService },
                provideRouter([]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render navigation links', () => {
        const dashboardLink = fixture.debugElement.query(
            By.css('a[routerLink="/dashboard"]'),
        );
        const vocabularyLink = fixture.debugElement.query(
            By.css('a[routerLink="/vocabulary"]'),
        );

        expect(dashboardLink).toBeTruthy();
        expect(vocabularyLink).toBeTruthy();
        expect(dashboardLink.nativeElement.textContent.trim()).toBe(
            'Dashboard',
        );
        expect(vocabularyLink.nativeElement.textContent.trim()).toBe(
            'Vocabulary',
        );
    });

    it('should render create vocabulary button', () => {
        const createButton = fixture.debugElement.query(
            By.css('button.btn-primary'),
        );

        expect(createButton).toBeTruthy();
        expect(createButton.nativeElement.textContent.trim()).toBe(
            '+ Create vocabulary',
        );
    });

    it('should call openVocabularyForm when create button is clicked', () => {
        const createButton = fixture.debugElement.query(
            By.css('button.btn-primary'),
        );
        createButton.nativeElement.click();

        expect(openVocabularyFormSpy).toHaveBeenCalled();
    });

    it('should call logout when logout button is clicked', () => {
        const logoutButton = fixture.debugElement.query(
            By.css('button.cursor-pointer'),
        );
        logoutButton.nativeElement.click();

        expect(logoutSpy).toHaveBeenCalled();
    });

    it('should call initializeAppData on init', () => {
        expect(initializeAppDataSpy).toHaveBeenCalled();
    });

    it('should show loading spinner when loading', () => {
        loadingSignal.set(true);
        fixture.detectChanges();

        const spinner = fixture.debugElement.query(
            By.css('.loading-spinner'),
        );
        expect(spinner).toBeTruthy();
    });

    it('should show router outlet when not loading', () => {
        const routerOutlet = fixture.debugElement.query(
            By.css('router-outlet'),
        );
        expect(routerOutlet).toBeTruthy();
    });

    it('should render vocabulary form modal', () => {
        const modal = fixture.debugElement.query(
            By.css('#vocabularyFormModal'),
        );
        expect(modal).toBeTruthy();
    });
});
