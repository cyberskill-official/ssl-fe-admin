import Prism from 'prismjs';

const globalScope = globalThis as typeof globalThis & { Prism?: typeof Prism };

if (!globalScope.Prism) {
    globalScope.Prism = Prism;
}

if (typeof window !== 'undefined' && !window.Prism) {
    window.Prism = Prism;
}
export { Prism };
