export interface I_FAQEntry {
    id: string;
    question: string;
    answer: string;
    isPublished: boolean;
}

export interface I_FAQEntryRowProps {
    entry: I_FAQEntry;
    index: number;
    onChange: (field: 'question' | 'answer' | 'isPublished', value: string | boolean) => void;
    onRemove: () => void;
    touched: boolean;
    canDelete: boolean;
}
