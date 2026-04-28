import { Tabs, TabsContent, TabsList, TabsTrigger } from '#shared/component/tabs';
import { E_LegalDocumentType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_DocumentTabsProps } from './document-tabs.type';

import { DocumentEditor } from './document-editor';

export function DocumentTabs({
    documents,
    documentsContent,
    onEditorChange,
    selectedTab,
    onTabChange,
}: I_DocumentTabsProps) {
    const { t } = useTranslate('legal-document');

    const _handleEditorChange = (type: E_LegalDocumentType) => (content: string) => {
        onEditorChange(type, content);
    };

    return (
        <Tabs value={selectedTab} onValueChange={value => onTabChange(value as E_LegalDocumentType)}>
            <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-700/80 border border-gray-200 dark:border-slate-600">
                {Object.values(E_LegalDocumentType).map(type => (
                    <TabsTrigger key={type} value={type} className="text-sm data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
                        {t(`documents.${type}.title`)}
                    </TabsTrigger>
                ))}
            </TabsList>

            {Object.values(E_LegalDocumentType).map((type) => {
                const document = documents.find(doc => doc.type === type);
                const currentContent = documentsContent[type] || document?.content || '';

                return (
                    <TabsContent key={type} value={type} className="mt-6">
                        <DocumentEditor
                            type={type}
                            value={currentContent}
                            onChange={_handleEditorChange(type)}
                            namespace={`LegalDoc_${type}`}
                        />
                    </TabsContent>
                );
            })}
        </Tabs>
    );
}
