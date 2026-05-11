import '#shared/util/prism';

import { CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { TRANSFORMERS } from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { useEffect, useMemo, useRef } from 'react';

import { cn } from '#shared/util';

import { ImageNode, VideoNode } from './media';
import Toolbar from './toolbar';

interface EditorProps {
    value?: string;
    // optional key to force replace editor content when externally changed
    valueKey?: string | number | null;
    onChange?: (value: string) => void;
    placeholder?: string;
    editable?: boolean;
    showToolbar?: boolean;
    className?: string;
    contentClassName?: string;
    autoFocus?: boolean;
}

interface OnChangePluginProps {
    onChange: (value: string) => void;
}

interface InitialValuePluginProps {
    value?: string;
    // optional key to force replace editor content when externally changed (e.g., switching document)
    valueKey?: string | number | null;
}

function OnChangePlugin({ onChange }: OnChangePluginProps) {
    const [editor] = useLexicalComposerContext();
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        let timeoutId: number | null = null;

        const unregister = editor.registerUpdateListener(() => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            // Debounce heavy serialization to avoid blocking main thread on each keystroke
            timeoutId = window.setTimeout(() => {
                try {
                    const snapshot = editor.getEditorState().toJSON();
                    onChangeRef.current(JSON.stringify(snapshot));
                }
                // eslint-disable-next-line unused-imports/no-unused-vars
                catch (err) {
                    try {
                        const fallback = editor.getEditorState().toJSON();
                        onChangeRef.current(JSON.stringify(fallback));
                    }
                    catch (err2) {
                        console.error('Failed to serialize editor state for onChange (debounced):', err2);
                    }
                }
                timeoutId = null;
            }, 300);
        });

        return () => {
            unregister();
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        };
    }, [editor]);

    return null;
}

function InitialValuePlugin({ value, valueKey }: InitialValuePluginProps) {
    const [editor] = useLexicalComposerContext();
    const appliedKeyRef = useRef<string | number | null | undefined>(undefined);
    const appliedValueRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const isFirstApply = appliedKeyRef.current === undefined;
        const keyChanged = valueKey !== undefined && valueKey !== null && appliedKeyRef.current !== valueKey;
        const rootElement = editor.getRootElement();
        const isEditorFocused = !!rootElement && typeof document !== 'undefined'
            && rootElement.contains(document.activeElement);
        const shouldSyncUnfocusedValue = !isEditorFocused && value !== appliedValueRef.current;

        if (!isFirstApply && !keyChanged && !shouldSyncUnfocusedValue) {
            return;
        }

        const expectedKey = valueKey ?? value ?? null;
        let cancelled = false;

        const timerId = window.setTimeout(() => {
            if (cancelled) {
                return;
            }

            if (!value) {
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                    root.append($createParagraphNode());
                });
                appliedValueRef.current = value;
                return;
            }

            try {
                const parsedValue = JSON.parse(value);
                const newState = editor.parseEditorState(parsedValue);
                editor.setEditorState(newState);
                appliedValueRef.current = value;
            }
            catch {
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                    const paragraph = $createParagraphNode();
                    paragraph.append($createTextNode(value?.trim() || ''));
                    root.append(paragraph);
                });
                appliedValueRef.current = value;
            }
        }, 0);

        appliedKeyRef.current = expectedKey;

        return () => {
            cancelled = true;
            window.clearTimeout(timerId);
        };
    }, [value, valueKey, editor]);

    return null;
}

const EDITOR_THEME = {
    ltr: 'ltr',
    rtl: 'rtl',
    paragraph: 'mb-1',
    quote: 'border-l-4 border-gray-300 pl-4 italic my-2',
    heading: {
        h1: 'text-3xl font-bold mb-2',
        h2: 'text-2xl font-bold mb-2',
        h3: 'text-xl font-bold mb-2',
        h4: 'text-lg font-bold mb-1',
        h5: 'text-base font-bold mb-1',
        h6: 'text-sm font-bold mb-1',
    },
    list: {
        nested: {
            listitem: 'ml-4',
        },
        ol: 'list-decimal ml-4',
        ul: 'list-disc ml-4',
        listitem: 'mb-1',
        listitemChecked: 'line-through opacity-60',
        listitemUnchecked: '',
    },
    text: {
        bold: 'font-bold',
        italic: 'italic',
        strikethrough: 'line-through',
        underline: 'underline',
        code: 'bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm font-mono',
    },
    textAlignLeft: 'text-left',
    textAlignCenter: 'text-center',
    textAlignRight: 'text-right',
    textAlignJustify: 'text-justify',
    indent: 'ml-8',
    code: 'bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm my-2 block overflow-x-auto',
    link: 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer',
    hr: 'border-t border-gray-300 dark:border-gray-700 my-4',
    hashtag: 'text-blue-600 dark:text-blue-400 font-medium',
    image: 'my-4 max-w-full',
    video: 'my-4 max-w-full',
};

const DEFAULT_NODES = [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    HorizontalRuleNode,
    CodeNode,
    ImageNode,
    VideoNode,
];

export { DEFAULT_NODES, EDITOR_THEME };

function LoadStatePlugin({ editable = true }: { editable?: boolean }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.setEditable(editable);
    }, [editor, editable]);

    return null;
}

export function Editor({
    value,
    // optional key to force replace editor content when externally changed
    valueKey,
    onChange,
    placeholder = '',
    editable = true,
    showToolbar = false,
    className = 'border rounded-lg bg-white dark:bg-gray-900',
    contentClassName = 'min-h-[200px] outline-none p-4 text-gray-900 dark:text-gray-100',
    autoFocus = false,
}: EditorProps) {
    const initialConfig = useMemo(() => ({
        namespace: 'LexicalEditor',
        theme: EDITOR_THEME,
        onError: (error: Error) => {
            console.error('Lexical error:', error);
        },
        nodes: DEFAULT_NODES,
        editable,
    }), [editable]);

    return (
        <div className={cn('relative', className)}>
            <LexicalComposer initialConfig={initialConfig}>
                <LoadStatePlugin editable={editable} />

                {showToolbar && <Toolbar />}

                <div className="relative overflow-hidden">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className={contentClassName} />
                        }
                        placeholder={(
                            <div className="absolute top-0 left-0 p-4 text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                                {placeholder}
                            </div>
                        )}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>

                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <ClickableLinkPlugin />
                <HorizontalRulePlugin />
                <TabIndentationPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <CheckListPlugin />

                {autoFocus && <AutoFocusPlugin />}
                {onChange && <OnChangePlugin onChange={onChange} />}
                {value !== undefined && <InitialValuePlugin value={value} valueKey={valueKey ?? null} />}
            </LexicalComposer>
        </div>
    );
}

export { LexicalPreview } from './preview';
