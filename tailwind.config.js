import daisyui from 'daisyui';

export default {
    content: ['./src/**/*.{html,ts}', './src/**/*.css'],
    theme: {
        extend: {},
    },
    plugins: [daisyui],
    daisyui: {
        themes: ['light'],
    },
    safelist: [
        'text-blue-500',
        'text-green-500',
        'alert-success',
        'alert-info',
    ],
};
