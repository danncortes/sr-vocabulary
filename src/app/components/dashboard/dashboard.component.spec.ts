import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComponent } from './dashboard.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [HttpClient, HttpHandler],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;

        // Mock the vocabularyStore.vocabulary method
        spyOn(component.vocabularyStore, 'vocabulary').and.returnValue({
            new: [
                {
                    id: 1,
                    original: { id: 1, text: 'Hello', audio_url: '' },
                    translated: { id: 2, text: 'Hola', audio_url: '' },
                    sr_stage_id: 1,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
                {
                    id: 2,
                    original: { id: 3, text: 'World', audio_url: '' },
                    translated: { id: 4, text: 'Mundo', audio_url: '' },
                    sr_stage_id: 1,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
                {
                    id: 3,
                    original: { id: 5, text: 'Casa', audio_url: '' },
                    translated: { id: 6, text: 'House', audio_url: '' },
                    sr_stage_id: 1,
                    review_date: '',
                    modified_at: '',
                    priority: 1,
                    learned: 0,
                },
            ],
            startedToday: [],
            review: [],
            rest: [],
            reviewedToday: [],
            learned: [],
        });

        // Mock sourceVocabulary signal
        spyOn(component.vocabularyStore, 'sourceVocabulary').and.returnValue([
            {
                id: 1,
                original: { id: 1, text: 'Hello', audio_url: '' },
                translated: { id: 2, text: 'Hola', audio_url: '' },
                sr_stage_id: 1,
                review_date: '',
                modified_at: '',
                priority: 1,
                learned: 0,
            },
            {
                id: 2,
                original: { id: 3, text: 'World', audio_url: '' },
                translated: { id: 4, text: 'Mundo', audio_url: '' },
                sr_stage_id: 1,
                review_date: '',
                modified_at: '',
                priority: 1,
                learned: 0,
            },
            {
                id: 3,
                original: { id: 5, text: 'Casa', audio_url: '' },
                translated: { id: 6, text: 'House', audio_url: '' },
                sr_stage_id: 1,
                review_date: '',
                modified_at: '',
                priority: 1,
                learned: 0,
            },
        ]);

        // Mock loading signal
        spyOn(component.vocabularyStore, 'loading').and.returnValue(false);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('show render the vocabulary list component with the new vocabulary', () => {
        const newVocabularyList =
            fixture.debugElement.nativeElement.querySelector(
                '.dashboard__new-vocabulary',
            );
        expect(newVocabularyList).toBeTruthy();
    });

    it('should display the title "New(3)" and top "0  started" text', () => {
        const titleElement = fixture.debugElement.nativeElement.querySelector(
            '.dashboard__new-vocabulary .vocabulary-list__title',
        );
        expect(titleElement).toBeTruthy();
        expect(titleElement.textContent.trim()).toBe('New(3)');

        const startedElement = fixture.debugElement.nativeElement.querySelector(
            '.dashboard__new-vocabulary .vocabulary-list__status',
        );
        expect(startedElement).toBeTruthy();
        expect(startedElement.textContent.trim()).toBe('0  started');
    });
});
