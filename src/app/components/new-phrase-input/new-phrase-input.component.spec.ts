import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { NewPhraseInputComponent } from './new-phrase-input.component';
import { AudioService } from '../../services/audio/audio.service';

describe('NewPhraseInputComponent', () => {
    let component: NewPhraseInputComponent;
    let fixture: ComponentFixture<NewPhraseInputComponent>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        mockAudioService = jasmine.createSpyObj('AudioService', ['generateAudio', 'playAudio']);
        mockAudioService.generateAudio.and.returnValue(of({ filename: 'generated-audio.mp3' }));

        await TestBed.configureTestingModule({
            imports: [NewPhraseInputComponent, FormsModule],
            providers: [{ provide: AudioService, useValue: mockAudioService }],
        }).compileComponents();

        fixture = TestBed.createComponent(NewPhraseInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('input bindings', () => {
        it('should have correct default values for all inputs', () => {
            expect(component.classNames()).toBe('');
            expect(component.type()).toBe('text');
            expect(component.id()).toBe('');
            expect(component.placeholder()).toBe('');
            expect(component.label()).toBe('');
            expect(component.locale()).toBe('');
            expect(component.audioFilename()).toBeNull();
            expect(component.loadingAudio()).toBeFalse();
            expect(component.clearingAudio()).toBeFalse();
            expect(component.generatingPhrase()).toBeFalse();
        });

        it('should apply classNames to input', () => {
            fixture.componentRef.setInput('classNames', 'custom-input-class');
            fixture.detectChanges();
            const input = fixture.nativeElement.querySelector('input');
            expect(input.classList.contains('custom-input-class')).toBeTrue();
        });

        it('should apply placeholder to input', () => {
            fixture.componentRef.setInput('placeholder', 'Enter phrase');
            fixture.detectChanges();
            const input = fixture.nativeElement.querySelector('input');
            expect(input.getAttribute('placeholder')).toBe('Enter phrase');
        });

        it('should display label text', () => {
            fixture.componentRef.setInput('label', 'Original Phrase');
            fixture.detectChanges();
            const label = fixture.nativeElement.querySelector('.label-text');
            expect(label.textContent).toBe('Original Phrase');
        });

        it('should display locale in button', () => {
            fixture.componentRef.setInput('locale', 'en-US');
            fixture.detectChanges();
            const localeButton = fixture.nativeElement.querySelector('.flex.gap-4.justify-between > button');
            expect(localeButton.textContent.trim()).toBe('en-US');
        });
    });

    describe('ControlValueAccessor implementation', () => {
        it('should have empty phrase initially', () => {
            expect(component.phrase).toBe('');
        });

        it('should update phrase via writeValue', () => {
            component.writeValue('Hello World');
            expect(component.phrase).toBe('Hello World');
        });

        it('should register onChange callback', () => {
            const onChangeSpy = jasmine.createSpy('onChange');
            component.registerOnChange(onChangeSpy);
            component.phrase = 'Test';
            component.onPhraseChange();
            expect(onChangeSpy).toHaveBeenCalledWith('Test');
        });

        it('should register onTouched callback', () => {
            const onTouchedSpy = jasmine.createSpy('onTouched');
            component.registerOnTouched(onTouchedSpy);
            expect(typeof (component as any).onTouched).toBe('function');
        });
    });

    describe('onPhraseChange', () => {
        it('should call onChange when phrase changes', () => {
            const onChangeSpy = jasmine.createSpy('onChange');
            component.registerOnChange(onChangeSpy);
            component.phrase = 'New phrase';
            component.onPhraseChange();
            expect(onChangeSpy).toHaveBeenCalledWith('New phrase');
        });
    });

    describe('onClearAudio', () => {
        it('should emit clearAudio event', () => {
            spyOn(component.clearAudio, 'emit');
            component.onClearAudio();
            expect(component.clearAudio.emit).toHaveBeenCalled();
        });
    });

    describe('onGenerateAudio', () => {
        it('should not generate audio if phrase is empty', () => {
            component.phrase = '';
            component.onGenerateAudio();
            expect(mockAudioService.generateAudio).not.toHaveBeenCalled();
        });

        it('should call audioService.generateAudio with phrase', fakeAsync(() => {
            component.phrase = 'Test phrase';
            component.onGenerateAudio();
            tick();
            expect(mockAudioService.generateAudio).toHaveBeenCalledWith('Test phrase');
        }));

        it('should set generatingAudio to true during generation and reset after complete', fakeAsync(() => {
            const generateSubject = new Subject<{ filename: string }>();
            mockAudioService.generateAudio.and.returnValue(generateSubject.asObservable());

            component.phrase = 'Test phrase';
            component.onGenerateAudio();
            expect(component.generatingAudio()).toBeTrue();

            generateSubject.next({ filename: 'test.mp3' });
            generateSubject.complete();
            tick();
            expect(component.generatingAudio()).toBeFalse();
        }));

        it('should emit audioGenerated with filename on success', fakeAsync(() => {
            spyOn(component.audioGenerated, 'emit');
            component.phrase = 'Test phrase';
            component.onGenerateAudio();
            tick();
            expect(component.audioGenerated.emit).toHaveBeenCalledWith('generated-audio.mp3');
        }));

        it('should set generatingAudio to false after success', fakeAsync(() => {
            component.phrase = 'Test phrase';
            component.onGenerateAudio();
            tick();
            expect(component.generatingAudio()).toBeFalse();
        }));

        it('should set generatingAudio to false on error', fakeAsync(() => {
            mockAudioService.generateAudio.and.returnValue(throwError(() => new Error('API Error')));
            component.phrase = 'Test phrase';
            component.onGenerateAudio();
            tick();
            expect(component.generatingAudio()).toBeFalse();
        }));

        it('should not emit audioGenerated on error', fakeAsync(() => {
            mockAudioService.generateAudio.and.returnValue(throwError(() => new Error('API Error')));
            spyOn(component.audioGenerated, 'emit');
            component.phrase = 'Test phrase';
            component.onGenerateAudio();
            tick();
            expect(component.audioGenerated.emit).not.toHaveBeenCalled();
        }));
    });

    describe('onPlayAudio', () => {
        it('should not emit if audioFilename is null', () => {
            fixture.componentRef.setInput('audioFilename', null);
            fixture.detectChanges();
            spyOn(component.playAudio, 'emit');
            component.onPlayAudio();
            expect(component.playAudio.emit).not.toHaveBeenCalled();
        });

        it('should emit playAudio with filename', () => {
            fixture.componentRef.setInput('audioFilename', 'test-audio.mp3');
            fixture.detectChanges();
            spyOn(component.playAudio, 'emit');
            component.onPlayAudio();
            expect(component.playAudio.emit).toHaveBeenCalledWith('test-audio.mp3');
        });
    });

    describe('button states', () => {
        describe('clear audio button', () => {
            it('should be disabled when audioFilename is null', () => {
                fixture.componentRef.setInput('audioFilename', null);
                fixture.detectChanges();
                const clearButton = fixture.nativeElement.querySelectorAll('ul button.btn')[0];
                expect(clearButton.disabled).toBeTrue();
            });

            it('should be disabled when clearingAudio is true', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.componentRef.setInput('clearingAudio', true);
                fixture.detectChanges();
                const clearButton = fixture.nativeElement.querySelectorAll('ul button.btn')[0];
                expect(clearButton.disabled).toBeTrue();
            });

            it('should be enabled when audioFilename exists and not clearing', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.componentRef.setInput('clearingAudio', false);
                fixture.detectChanges();
                const clearButton = fixture.nativeElement.querySelectorAll('ul button.btn')[0];
                expect(clearButton.disabled).toBeFalse();
            });

            it('should call onClearAudio when clicked', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.detectChanges();
                spyOn(component, 'onClearAudio');
                const clearButton = fixture.nativeElement.querySelectorAll('ul button.btn')[0];
                clearButton.click();
                expect(component.onClearAudio).toHaveBeenCalled();
            });
        });

        describe('generate audio button', () => {
            it('should be disabled when phrase is empty', () => {
                component.phrase = '';
                fixture.detectChanges();
                const generateButton = fixture.nativeElement.querySelectorAll('ul button.btn')[1];
                expect(generateButton.disabled).toBeTrue();
            });

            it('should be disabled when generating audio', () => {
                component.phrase = 'Test';
                component.generatingAudio.set(true);
                fixture.detectChanges();
                const generateButton = fixture.nativeElement.querySelectorAll('ul button.btn')[1];
                expect(generateButton.disabled).toBeTrue();
            });

            it('should be enabled when phrase exists and not generating', () => {
                component.phrase = 'Test';
                component.generatingAudio.set(false);
                fixture.detectChanges();
                const generateButton = fixture.nativeElement.querySelectorAll('ul button.btn')[1];
                expect(generateButton.disabled).toBeFalse();
            });

            it('should show loading spinner when generating', () => {
                component.phrase = 'Test';
                component.generatingAudio.set(true);
                fixture.detectChanges();
                const generateButton = fixture.nativeElement.querySelectorAll('ul button.btn')[1];
                const spinner = generateButton.querySelector('.loading');
                expect(spinner).toBeTruthy();
            });

            it('should show speaker-wave icon when not generating', () => {
                component.phrase = 'Test';
                component.generatingAudio.set(false);
                fixture.detectChanges();
                const generateButton = fixture.nativeElement.querySelectorAll('ul button.btn')[1];
                const icon = generateButton.querySelector('app-icon');
                expect(icon).toBeTruthy();
            });

            it('should call onGenerateAudio when clicked', () => {
                component.phrase = 'Test';
                fixture.detectChanges();
                spyOn(component, 'onGenerateAudio');
                const generateButton = fixture.nativeElement.querySelectorAll('ul button.btn')[1];
                generateButton.click();
                expect(component.onGenerateAudio).toHaveBeenCalled();
            });
        });

        describe('play audio button', () => {
            it('should be disabled when audioFilename is null', () => {
                fixture.componentRef.setInput('audioFilename', null);
                fixture.detectChanges();
                const playButton = fixture.nativeElement.querySelectorAll('ul button.btn')[2];
                expect(playButton.disabled).toBeTrue();
            });

            it('should be disabled when loadingAudio is true', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.componentRef.setInput('loadingAudio', true);
                fixture.detectChanges();
                const playButton = fixture.nativeElement.querySelectorAll('ul button.btn')[2];
                expect(playButton.disabled).toBeTrue();
            });

            it('should be enabled when audioFilename exists and not loading', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.componentRef.setInput('loadingAudio', false);
                fixture.detectChanges();
                const playButton = fixture.nativeElement.querySelectorAll('ul button.btn')[2];
                expect(playButton.disabled).toBeFalse();
            });

            it('should show loading spinner when loading audio', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.componentRef.setInput('loadingAudio', true);
                fixture.detectChanges();
                const playButton = fixture.nativeElement.querySelectorAll('ul button.btn')[2];
                const spinner = playButton.querySelector('.loading');
                expect(spinner).toBeTruthy();
            });

            it('should show play icon when not loading', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.componentRef.setInput('loadingAudio', false);
                fixture.detectChanges();
                const playButton = fixture.nativeElement.querySelectorAll('ul button.btn')[2];
                const icon = playButton.querySelector('app-icon');
                expect(icon).toBeTruthy();
            });

            it('should call onPlayAudio when clicked', () => {
                fixture.componentRef.setInput('audioFilename', 'test.mp3');
                fixture.detectChanges();
                spyOn(component, 'onPlayAudio');
                const playButton = fixture.nativeElement.querySelectorAll('ul button.btn')[2];
                playButton.click();
                expect(component.onPlayAudio).toHaveBeenCalled();
            });
        });
    });

    describe('input element', () => {
        it('should update phrase on input change', fakeAsync(() => {
            const input = fixture.nativeElement.querySelector('input');
            input.value = 'New value';
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();
            tick();
            expect(component.phrase).toBe('New value');
        }));

        it('should have correct id attribute', () => {
            fixture.componentRef.setInput('id', 'phrase-input');
            fixture.detectChanges();
            const input = fixture.nativeElement.querySelector('input');
            expect(input.id).toBe('phrase-input');
        });

        it('should link label to input via for attribute', () => {
            fixture.componentRef.setInput('id', 'test-id');
            fixture.detectChanges();
            const label = fixture.nativeElement.querySelector('label');
            expect(label.getAttribute('for')).toBe('test-id');
        });
    });

    describe('output events', () => {
        it('should have audioGenerated output', () => {
            expect(component.audioGenerated).toBeDefined();
        });

        it('should have playAudio output', () => {
            expect(component.playAudio).toBeDefined();
        });

        it('should have clearAudio output', () => {
            expect(component.clearAudio).toBeDefined();
        });

        it('should have generatePhrase output', () => {
            expect(component.generatePhrase).toBeDefined();
        });
    });

    describe('onGeneratePhrase', () => {
        it('should not emit if phrase is empty', () => {
            component.phrase = '';
            spyOn(component.generatePhrase, 'emit');
            component.onGeneratePhrase();
            expect(component.generatePhrase.emit).not.toHaveBeenCalled();
        });

        it('should emit generatePhrase when phrase is not empty', () => {
            component.phrase = 'Test phrase';
            spyOn(component.generatePhrase, 'emit');
            component.onGeneratePhrase();
            expect(component.generatePhrase.emit).toHaveBeenCalled();
        });
    });

    describe('generate phrase button', () => {
        it('should be disabled when phrase is empty', () => {
            component.phrase = '';
            fixture.detectChanges();
            const generatePhraseButton = fixture.nativeElement.querySelector('.form-control button.btn');
            expect(generatePhraseButton.disabled).toBeTrue();
        });

        it('should be disabled when generatingPhrase is true', () => {
            component.phrase = 'Test';
            fixture.componentRef.setInput('generatingPhrase', true);
            fixture.detectChanges();
            const generatePhraseButton = fixture.nativeElement.querySelector('.form-control button.btn');
            expect(generatePhraseButton.disabled).toBeTrue();
        });

        it('should be enabled when phrase exists and not generating', () => {
            component.phrase = 'Test';
            fixture.componentRef.setInput('generatingPhrase', false);
            fixture.detectChanges();
            const generatePhraseButton = fixture.nativeElement.querySelector('.form-control button.btn');
            expect(generatePhraseButton.disabled).toBeFalse();
        });

        it('should show loading spinner when generating phrase', () => {
            component.phrase = 'Test';
            fixture.componentRef.setInput('generatingPhrase', true);
            fixture.detectChanges();
            const generatePhraseButton = fixture.nativeElement.querySelector('.form-control button.btn');
            const spinner = generatePhraseButton.querySelector('.loading-spinner');
            expect(spinner).toBeTruthy();
        });

        it('should show sparkles icon when not generating', () => {
            component.phrase = 'Test';
            fixture.componentRef.setInput('generatingPhrase', false);
            fixture.detectChanges();
            const generatePhraseButton = fixture.nativeElement.querySelector('.form-control button.btn');
            const icon = generatePhraseButton.querySelector('app-icon');
            expect(icon).toBeTruthy();
        });

        it('should call onGeneratePhrase when clicked', () => {
            component.phrase = 'Test';
            fixture.detectChanges();
            spyOn(component, 'onGeneratePhrase');
            const generatePhraseButton = fixture.nativeElement.querySelector('.form-control button.btn');
            generatePhraseButton.click();
            expect(component.onGeneratePhrase).toHaveBeenCalled();
        });
    });
});
