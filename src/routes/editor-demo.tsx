import { useState } from 'react';

import { Editor } from '#shared/component/editor';

import type { Route } from './+types/editor-demo';

export function meta(_args: Route.MetaArgs) {
    return [
        { title: 'Editor Demo - SSL Admin' },
        { name: 'description', content: 'Test the new Lexical editor with enhanced features' },
    ];
}

export default function EditorDemo() {
    const [editorValue, setEditorValue] = useState<string>('');

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Lexical Editor Demo</h1>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Enhanced Editor</h2>

                    <Editor
                        value={editorValue}
                        onChange={setEditorValue}
                        placeholder="Bắt đầu viết nội dung của bạn..."
                        showToolbar={true}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                        contentClassName="min-h-[300px] p-4 focus:outline-none"
                        autoFocus={true}
                    />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">Editor Value (JSON):</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto max-h-40">
                        {editorValue || 'No content yet...'}
                    </pre>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-200">
                        Available Features:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Bold, Italic, Underline, Strikethrough
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Undo/Redo functionality
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Heading support (H1-H6)
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Auto-focus and placeholder
                            </li>
                        </ul>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                Lists (Coming soon)
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                Links (Coming soon)
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                Code blocks (Coming soon)
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                Markdown shortcuts (Coming soon)
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200">
                        Keyboard Shortcuts:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <ul className="space-y-1">
                            <li>
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+B</kbd>
                                {' '}
                                - Bold
                            </li>
                            <li>
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+I</kbd>
                                {' '}
                                - Italic
                            </li>
                            <li>
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+U</kbd>
                                {' '}
                                - Underline
                            </li>
                        </ul>
                        <ul className="space-y-1">
                            <li>
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Z</kbd>
                                {' '}
                                - Undo
                            </li>
                            <li>
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Y</kbd>
                                {' '}
                                - Redo
                            </li>
                            <li>
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Tab</kbd>
                                {' '}
                                - Indent
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
