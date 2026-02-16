import { Component, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { AudioService } from '../../services/audio/audio.service';

@Component({
    selector: 'app-new-phrase-input',
    templateUrl: './new-phrase-input.component.html',
    styleUrl: './new-phrase-input.component.css',
    imports: [FormsModule, IconComponent],
    host: {
        class: 'block',
    },
})
export class NewPhraseInputComponent implements ControlValueAccessor {
    private audioService = inject(AudioService);
    private ngControl = inject(NgControl, { optional: true, self: true });

    constructor() {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    classNames = input<string>('');
    type = input<'text' | 'textarea'>('text');
    id = input<string>('');
    placeholder = input<string>('');
    label = input<string>('');
    locale = input<string | undefined>('');
    audioFilename = input<string | null>(null);
    loadingAudio = input<boolean>(false);
    clearingAudio = input<boolean>(false);
    generatingPhrase = input<boolean>(false);

    phrase = '';
    generatingAudio = signal(false);

    audioGenerated = output<string>();
    playAudio = output<string>();
    clearAudio = output<void>();
    generatePhrase = output<void>();

    private onChange: (value: string) => void = () => {};
    private onTouched: (value: string) => void = () => {};

    writeValue(value: string): void {
        this.phrase = value;
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: (value: string) => void): void {
        this.onTouched = fn;
    }

    onPhraseChange(): void {
        this.onChange(this.phrase);
    }

    onClearAudio(): void {
        this.clearAudio.emit();
    }

    onGenerateAudio(): void {
        if (!this.phrase) return;

        this.generatingAudio.set(true);
        this.audioService.generateAudio(this.phrase).subscribe({
            next: (response) => {
                this.audioGenerated.emit(response.filename);
                this.generatingAudio.set(false);
            },
            error: () => {
                this.generatingAudio.set(false);
            },
        });
    }

    onPlayAudio(): void {
        const filename = this.audioFilename();
        if (!filename) return;
        this.playAudio.emit(filename);
    }

    onGeneratePhrase(): void {
        if (!this.phrase) return;
        this.generatePhrase.emit();
    }
}
