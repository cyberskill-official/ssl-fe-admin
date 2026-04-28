import { Check, ExternalLink, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../button';
import { Input } from '../input';

const PROTOCOL_RE = /^[a-z]+:\/\//i;

interface LinkEditorProps {
    isOpen: boolean;
    initialUrl?: string;
    onSave: (url: string) => void;
    onRemove?: () => void;
    onClose: () => void;
}

export function LinkEditor({ isOpen, initialUrl = '', onSave, onRemove, onClose }: LinkEditorProps) {
    const [url, setUrl] = useState(initialUrl);
    const [isValid, setIsValid] = useState(true);
    const urlRef = useRef(setUrl);
    const validRef = useRef(setIsValid);

    // Update refs to latest setters
    urlRef.current = setUrl;
    validRef.current = setIsValid;

    useEffect(() => {
        if (isOpen) {
            urlRef.current(initialUrl);
            validRef.current(true);
        }
    }, [isOpen, initialUrl]);

    const validateUrl = (value: string) => {
        if (!value.trim())
            return false;
        if (URL.canParse(value))
            return true;
        // Check if it's a relative path or needs protocol
        return value.startsWith('/') || value.includes('.');
    };

    const handleSave = () => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) {
            setIsValid(false);
            return;
        }

        // Auto-add https:// if no protocol is specified
        let finalUrl = trimmedUrl;
        if (!PROTOCOL_RE.test(finalUrl)) {
            finalUrl = `https://${finalUrl}`;
        }

        if (validateUrl(finalUrl)) {
            onSave(finalUrl);
            onClose();
        }
        else {
            setIsValid(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen)
        return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ExternalLink size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {initialUrl ? 'Edit Link' : 'Insert Link'}
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X size={16} />
                    </Button>
                </div>

                {/* URL Input */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL
                        </label>
                        <Input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setIsValid(true);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="https://example.com"
                            autoFocus
                            className={`w-full ${!isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {!isValid && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                Please enter a valid URL
                            </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Tip: Enter
                            {' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">example.com</code>
                            {' '}
                            and we'll add https:// automatically
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <div>
                            {initialUrl && onRemove && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onRemove();
                                        onClose();
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
                                >
                                    Remove Link
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Check size={16} className="mr-1" />
                                {initialUrl ? 'Update' : 'Insert'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
