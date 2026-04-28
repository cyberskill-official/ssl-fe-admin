import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { useEffect, useRef } from 'react';

import { DEFAULT_NODES, EDITOR_THEME } from './index';

const HTML_TAG_RE = /<[^>]*>/g;

interface LexicalPreviewProps {
    content?: string;
    className?: string;
}

interface InitialContentPluginProps {
    content?: string;
}

function InitialContentPlugin({ content }: InitialContentPluginProps) {
    const [editor] = useLexicalComposerContext();
    const lastContentRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!content || content === lastContentRef.current) {
            return;
        }

        lastContentRef.current = content;
        let cancelled = false;

        const timerId = window.setTimeout(() => {
            if (cancelled) {
                return;
            }

            try {
                const parsedContent = JSON.parse(content);
                const newState = editor.parseEditorState(parsedContent);
                editor.setEditorState(newState);
            }
            catch {
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                    const paragraph = $createParagraphNode();
                    const textContent = content?.trim() || '';
                    const cleanText = textContent.replace(HTML_TAG_RE, '');
                    paragraph.append($createTextNode(cleanText));
                    root.append(paragraph);
                });
            }
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timerId);
        };
    }, [content, editor]);

    return null;
}

export function LexicalPreview({
    content,
    className = 'p-4 prose prose-gray dark:prose-invert max-w-none',
}: LexicalPreviewProps) {
    const initialConfig = {
        namespace: 'LexicalPreview',
        theme: EDITOR_THEME,
        onError: (error: Error) => {
            console.error('Lexical preview error:', error);
        },
        nodes: DEFAULT_NODES,
        editable: false, // Read-only mode
    };

    return (
        <div className="bg-transparent">
            <LexicalComposer initialConfig={initialConfig}>
                <InitialContentPlugin content={content} />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className={className} />
                    }
                    placeholder={
                        (
                            <div className={`${className} text-gray-400 pointer-events-none`}>
                                No content to preview...
                            </div>
                        )
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
            </LexicalComposer>
        </div>
    );
}
