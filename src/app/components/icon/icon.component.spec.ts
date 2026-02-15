import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent, IconType } from './icon.component';

describe('IconComponent', () => {
    let component: IconComponent;
    let fixture: ComponentFixture<IconComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IconComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(IconComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.componentRef.setInput('type', 'play');
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('SVG rendering', () => {
        it('should render an SVG element', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.detectChanges();
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg).toBeTruthy();
        });

        it('should have default size-6 class', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.detectChanges();
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('size-6')).toBeTrue();
        });
    });

    describe('Icon types', () => {
        const iconTypes: IconType[] = [
            'play',
            'check-circle',
            'ellipsis-horizontal',
            'speaker-wave',
            'speaker-x-mark',
            'pencil',
            'trash',
        ];

        iconTypes.forEach((iconType) => {
            it(`should render path for "${iconType}" icon`, () => {
                fixture.componentRef.setInput('type', iconType);
                fixture.detectChanges();
                const path = fixture.nativeElement.querySelector('svg path');
                expect(path).toBeTruthy();
                expect(path.getAttribute('d')).toBeTruthy();
            });
        });

        it('should render play icon path correctly', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.detectChanges();
            const path = fixture.nativeElement.querySelector('svg path');
            expect(path.getAttribute('d')).toContain('M5.25 5.653');
        });

        it('should render check-circle icon path correctly', () => {
            fixture.componentRef.setInput('type', 'check-circle');
            fixture.detectChanges();
            const path = fixture.nativeElement.querySelector('svg path');
            expect(path.getAttribute('d')).toContain('M9 12.75');
        });

        it('should render trash icon path correctly', () => {
            fixture.componentRef.setInput('type', 'trash');
            fixture.detectChanges();
            const path = fixture.nativeElement.querySelector('svg path');
            expect(path.getAttribute('d')).toContain('m14.74 9');
        });

        it('should render pencil icon path correctly', () => {
            fixture.componentRef.setInput('type', 'pencil');
            fixture.detectChanges();
            const path = fixture.nativeElement.querySelector('svg path');
            expect(path.getAttribute('d')).toContain('m16.862 4.487');
        });
    });

    describe('customClass input', () => {
        it('should apply custom class to SVG', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.componentRef.setInput('customClass', 'text-red-500');
            fixture.detectChanges();
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('text-red-500')).toBeTrue();
        });

        it('should combine size-6 with custom class', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.componentRef.setInput('customClass', 'custom-class');
            fixture.detectChanges();
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('size-6')).toBeTrue();
            expect(svg.classList.contains('custom-class')).toBeTrue();
        });

        it('should have empty custom class by default', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.detectChanges();
            expect(component.customClass()).toBe('');
        });

        it('should apply multiple custom classes', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.componentRef.setInput('customClass', 'text-blue-500 hover:text-blue-700');
            fixture.detectChanges();
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.classList.contains('text-blue-500')).toBeTrue();
            expect(svg.classList.contains('hover:text-blue-700')).toBeTrue();
        });
    });

    describe('SVG attributes', () => {
        it('should have proper SVG attributes', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.detectChanges();
            const svg = fixture.nativeElement.querySelector('svg');
            expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
            expect(svg.getAttribute('fill')).toBe('none');
            expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
            expect(svg.getAttribute('stroke-width')).toBe('1.5');
            expect(svg.getAttribute('stroke')).toBe('currentColor');
        });

        it('should have stroke-linecap and stroke-linejoin on paths', () => {
            fixture.componentRef.setInput('type', 'play');
            fixture.detectChanges();
            const path = fixture.nativeElement.querySelector('svg path');
            expect(path.getAttribute('stroke-linecap')).toBe('round');
            expect(path.getAttribute('stroke-linejoin')).toBe('round');
        });
    });
});
