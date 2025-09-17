import { Component, input } from '@angular/core';

export type IconType = 'play' | 'check-circle' | 'ellipsis-horizontal';

@Component({
    selector: 'app-icon',
    imports: [],
    template: `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            [class]="'size-5 ' + customClass()"
        >
            @switch (type()) {
                @case ('play') {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                    />
                }
                @case ('check-circle') {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                }
                @case ('ellipsis-horizontal') {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                }
            }
        </svg>
    `,
})
export class IconComponent {
    type = input.required<IconType>();
    customClass = input<string>('');
}
