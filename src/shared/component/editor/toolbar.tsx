import type { HeadingTagType } from '@lexical/rich-text';
import type { ElementNode, LexicalNode } from 'lexical';

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
} from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import {
    $createParagraphNode,
    $createTextNode,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isTextNode,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,

    FORMAT_TEXT_COMMAND,
    INDENT_CONTENT_COMMAND,

    OUTDENT_CONTENT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from 'lexical';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Heading1,
    Heading2,
    Heading3,
    Image,
    Indent,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Play,
    Quote,
    Redo,
    Strikethrough,
    Underline,
    Undo,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../button';
import { LinkEditor } from './link-editor';
import { $createImageNode, $createVideoNode } from './media';

const ICON_SIZE = 16;

export default function Toolbar() {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [blockType, setBlockType] = useState('paragraph');
    const [textAlignment, setTextAlignment] = useState('left');
    const [showLinkEditor, setShowLinkEditor] = useState(false);
    const [currentLinkUrl, setCurrentLinkUrl] = useState('');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Update text formatting
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));

            // Check if selected text is a link
            const node = selection.anchor.getNode();
            const parent = node.getParent();
            setIsLink($isLinkNode(parent) || $isLinkNode(node));

            // Update block type - check both block-level headings and inline styles
            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getKey() === 'root'
                ? anchorNode
                : anchorNode.getTopLevelElementOrThrow();

            // First check if it's a block-level heading
            if ($isHeadingNode(element)) {
                setBlockType(element.getTag());
            }
            else {
                // Check if selected text has inline heading styles
                let detectedHeadingStyle = 'paragraph';

                if ($isTextNode(node)) {
                    const style = node.getStyle();
                    if (style) {
                        // Check for inline font-size that matches our heading sizes
                        if (style.includes('font-size: 2em')) {
                            detectedHeadingStyle = 'h1';
                        }
                        else if (style.includes('font-size: 1.5em')) {
                            detectedHeadingStyle = 'h2';
                        }
                        else if (style.includes('font-size: 1.17em')) {
                            detectedHeadingStyle = 'h3';
                        }
                    }
                }

                setBlockType(detectedHeadingStyle);
            }
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar();
                    return false;
                },
                1,
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                1,
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                1,
            ),
        );
    }, [editor, updateToolbar]);

    const formatHeading = (headingSize: HeadingTagType) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                if (selection.isCollapsed()) {
                    // Cursor only: Toggle block type for the whole block
                    const uniqueElements = new Set<ElementNode>();
                    selection.getNodes().forEach((node) => {
                        const element = node.getTopLevelElement();
                        if (element && $isElementNode(element)) {
                            uniqueElements.add(element);
                        }
                    });

                    uniqueElements.forEach((element) => {
                        if (element.getType() !== headingSize) {
                            const newHeading = $createHeadingNode(headingSize);
                            const children = element.getChildren();
                            children.forEach((child: LexicalNode) => newHeading.append(child));
                            element.replace(newHeading);
                        }
                        else {
                            const newParagraph = $createParagraphNode();
                            const children = element.getChildren();
                            children.forEach((child: LexicalNode) => newParagraph.append(child));
                            element.replace(newParagraph);
                        }
                    });
                }
                else {
                    // Text selected: Apply inline formatting to ONLY the selected text
                    const fontSize = headingSize === 'h1' ? '2em' : headingSize === 'h2' ? '1.5em' : '1.17em';
                    const fontWeight = 'bold';

                    // Apply format using Lexical's built-in text formatting
                    // This properly handles partial selections within text nodes
                    const anchor = selection.anchor;
                    const focus = selection.focus;
                    const isBackward = selection.isBackward();

                    const [start, end] = isBackward ? [focus, anchor] : [anchor, focus];

                    // Get the text nodes and apply style
                    const nodes = selection.getNodes();

                    nodes.forEach((node, index) => {
                        if ($isTextNode(node)) {
                            const nodeText = node.getTextContent();
                            const nodeKey = node.getKey();

                            // Determine the portion of this node that's selected
                            let startOffset = 0;
                            let endOffset = nodeText.length;

                            if (index === 0 && start.getNode().getKey() === nodeKey) {
                                startOffset = start.offset;
                            }
                            if (index === nodes.length - 1 && end.getNode().getKey() === nodeKey) {
                                endOffset = end.offset;
                            }

                            // If the entire node is selected, just update its style
                            if (startOffset === 0 && endOffset === nodeText.length) {
                                const existingStyle = node.getStyle();
                                const cleanStyle = existingStyle
                                    .split(';')
                                    .filter(s => !s.trim().startsWith('font-size') && !s.trim().startsWith('font-weight'))
                                    .join(';');
                                const newStyle = `${cleanStyle}; font-size: ${fontSize}; font-weight: ${fontWeight}`.trim();
                                node.setStyle(newStyle);
                            }
                            else {
                                // Partial selection: split the node
                                const beforeText = nodeText.substring(0, startOffset);
                                const selectedText = nodeText.substring(startOffset, endOffset);
                                const afterText = nodeText.substring(endOffset);

                                const styledNode = $createTextNode(selectedText);
                                const newStyle = `font-size: ${fontSize}; font-weight: ${fontWeight}`;
                                styledNode.setStyle(newStyle);

                                if (beforeText && afterText) {
                                    // Split into 3 nodes
                                    const beforeNode = $createTextNode(beforeText);
                                    const afterNode = $createTextNode(afterText);
                                    node.replace(beforeNode);
                                    beforeNode.insertAfter(styledNode);
                                    styledNode.insertAfter(afterNode);
                                }
                                else if (beforeText) {
                                    // Split into 2 nodes (before + styled)
                                    const beforeNode = $createTextNode(beforeText);
                                    node.replace(beforeNode);
                                    beforeNode.insertAfter(styledNode);
                                }
                                else if (afterText) {
                                    // Split into 2 nodes (styled + after)
                                    const afterNode = $createTextNode(afterText);
                                    node.replace(styledNode);
                                    styledNode.insertAfter(afterNode);
                                }
                                else {
                                    // Just replace with styled node
                                    node.replace(styledNode);
                                }
                            }
                        }
                    });
                }
            }
        });
    };

    const formatQuote = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                if (selection.isCollapsed()) {
                    // Cursor only: Toggle block type
                    const uniqueElements = new Set<ElementNode>();
                    selection.getNodes().forEach((node) => {
                        const element = node.getTopLevelElement();
                        if (element && $isElementNode(element)) {
                            uniqueElements.add(element);
                        }
                    });

                    uniqueElements.forEach((element) => {
                        if (element.getType() !== 'quote') {
                            const newQuote = $createQuoteNode();
                            const children = element.getChildren();
                            children.forEach((child: LexicalNode) => newQuote.append(child));
                            element.replace(newQuote);
                        }
                        else {
                            const newParagraph = $createParagraphNode();
                            const children = element.getChildren();
                            children.forEach((child: LexicalNode) => newParagraph.append(child));
                            element.replace(newParagraph);
                        }
                    });
                }
                else {
                    // Text selected: Split and format
                    const textContent = selection.getTextContent();
                    const quote = $createQuoteNode();
                    quote.append($createTextNode(textContent));

                    // Remove selected text first to ensure clean insertion point
                    selection.removeText();
                    selection.insertNodes([quote]);
                }
            }
        });
    };

    const formatBulletList = () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    };

    const formatNumberedList = () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    };

    const formatAlignment = (alignment: 'left' | 'center' | 'right') => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                // Note: Alignment functionality requires additional setup
                // This is a simplified version
                setTextAlignment(alignment);
            }
        });
    };

    const handleIndent = () => {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    };

    const handleOutdent = () => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
    };

    const handleImageInsert = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageSrc = event.target?.result as string;
                    editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            const imageNode = $createImageNode({
                                src: imageSrc,
                                altText: file.name || 'Uploaded image',
                            });
                            selection.insertNodes([imageNode]);
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleVideoInsert = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const videoSrc = event.target?.result as string;
                    editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            const videoNode = $createVideoNode(
                                videoSrc,
                                undefined,
                                undefined,
                                file.name || 'Uploaded video',
                                `Video: ${file.name}`,
                            );
                            selection.insertNodes([videoNode]);
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleInsertLink = () => {
        if (!isLink) {
            // Open link editor to insert new link
            setCurrentLinkUrl('');
            setShowLinkEditor(true);
        }
        else {
            // Remove existing link
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    };

    const handleLinkSave = (url: string) => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    };

    const handleLinkRemove = () => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    };

    return (
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-900 rounded-t-lg flex-wrap">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canUndo}
                    onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
                    className="h-8 w-8 p-0"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canRedo}
                    onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
                    className="h-8 w-8 p-0"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Text formatting */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
                    className={`h-8 w-8 p-0 ${isBold ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                    className={`h-8 w-8 p-0 ${isItalic ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
                    className={`h-8 w-8 p-0 ${isUnderline ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Underline (Ctrl+U)"
                >
                    <Underline size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
                    className={`h-8 w-8 p-0 ${isStrikethrough ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Strikethrough"
                >
                    <Strikethrough size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Link */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleInsertLink}
                    className={`h-8 w-8 p-0 ${isLink ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title={isLink ? 'Remove Link' : 'Insert Link (Ctrl+K)'}
                >
                    <LinkIcon size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Headings */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatHeading('h1')}
                    className={`h-8 w-8 p-0 ${blockType === 'h1' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Heading 1"
                >
                    <Heading1 size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatHeading('h2')}
                    className={`h-8 w-8 p-0 ${blockType === 'h2' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Heading 2"
                >
                    <Heading2 size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatHeading('h3')}
                    className={`h-8 w-8 p-0 ${blockType === 'h3' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Heading 3"
                >
                    <Heading3 size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Lists and Quote */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatBulletList}
                    className="h-8 w-8 p-0"
                    title="Bullet List"
                >
                    <List size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatNumberedList}
                    className="h-8 w-8 p-0"
                    title="Numbered List"
                >
                    <ListOrdered size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatQuote}
                    className="h-8 w-8 p-0"
                    title="Quote"
                >
                    <Quote size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatAlignment('left')}
                    className={`h-8 w-8 p-0 ${textAlignment === 'left' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Align Left"
                >
                    <AlignLeft size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatAlignment('center')}
                    className={`h-8 w-8 p-0 ${textAlignment === 'center' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Align Center"
                >
                    <AlignCenter size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatAlignment('right')}
                    className={`h-8 w-8 p-0 ${textAlignment === 'right' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    title="Align Right"
                >
                    <AlignRight size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Indent/Outdent */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOutdent}
                    className="h-8 w-8 p-0"
                    title="Decrease Indent"
                >
                    <Indent size={ICON_SIZE} className="rotate-180" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleIndent}
                    className="h-8 w-8 p-0"
                    title="Increase Indent"
                >
                    <Indent size={ICON_SIZE} />
                </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Media Insert */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => handleImageInsert(e)}
                    className="h-8 w-8 p-0"
                    title="Insert Image"
                >
                    <Image size={ICON_SIZE} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => handleVideoInsert(e)}
                    className="h-8 w-8 p-0"
                    title="Insert Video"
                >
                    <Play size={ICON_SIZE} />
                </Button>
            </div>

            {/* Link Editor Modal */}
            <LinkEditor
                isOpen={showLinkEditor}
                initialUrl={currentLinkUrl}
                onSave={handleLinkSave}
                onRemove={isLink ? handleLinkRemove : undefined}
                onClose={() => setShowLinkEditor(false)}
            />
        </div>
    );
}
