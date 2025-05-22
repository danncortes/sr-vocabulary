import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhraseComponent } from './phrase.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('PhraseComponent', () => {
    let component: PhraseComponent;
    let fixture: ComponentFixture<PhraseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PhraseComponent],
            providers: [HttpClient, HttpHandler],
        }).compileComponents();

        fixture = TestBed.createComponent(PhraseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
