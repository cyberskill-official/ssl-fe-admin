import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW, KEY_MODIFIER_COMMAND } from 'lexical';
import { useEffect } from 'react';

interface LinkShortcutPluginProps {
    onLinkShortcut: () => void;
}

export function LinkShortcutPlugin({ onLinkShortcut }: LinkShortcutPluginProps) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                KEY_MODIFIER_COMMAND,
                (event: KeyboardEvent) => {
                    const { key, ctrlKey, metaKey } = event;
                    if (key === 'k' && (ctrlKey || metaKey)) {
                        event.preventDefault();
                        onLinkShortcut();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, onLinkShortcut]);

    return null;
}
