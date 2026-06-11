/* eslint-disable react-dom/no-unsafe-iframe-sandbox */
import type { Ref } from 'react';

import {
    Eye,
    FileText,
    Link as LinkIcon,
    Save,
    Settings,
    Tag,
    Upload,
    X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useImperativeHandle, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller, useForm } from 'react-hook-form';

import type { E_SocialPlatform, Input_CreateBlog, Input_UpdateBlog, T_Blog, T_SocialLink, T_User } from '#shared/graphql';

import { useUpload } from '#modules/upload/upload.hook';
import { useGetUsers } from '#modules/user/user.hook';
import { AutocompleteSelect, Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { Editor } from '#shared/component/editor';
import { LexicalPreview } from '#shared/component/editor/preview';
import { FloatLabel } from '#shared/component/float-label';
import { E_BlogCategory, E_BlogType, E_UploadEntity, E_UploadType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';

import { useAllLanguages } from '../language/language.hook';
import { getBlogFormText, getBlogText } from './blog-text';
import { useGetBlogs } from './blog.hook';
import { BlogSocialLinks } from './components/blog-social-links';
import { getPodcastEmbedHeight, normalizePodcastEmbedUrl } from './podcast-embed';

const HTML_TAG_RE = /<[^>]*>/g;
const UNDERSCORE_RE = /_/g;
const WORD_START_RE = /\b\w/g;

export interface I_BlogFormApi {
    open: (blog?: T_Blog) => void;
    close: () => void;
}

function BlogPreview({ formData, type, selectedAuthor }: { formData: any; type: E_BlogType; selectedAuthor?: T_User | null }) {
    const isPodcast = type === E_BlogType.PODCAST;
    const podcastEmbedUrl = normalizePodcastEmbedUrl(formData.iframe);

    // Get author's profile picture from gallery
    const authorProfilePicture = selectedAuthor?.partner1?.gallery?.url;
    const authorUsername = selectedAuthor?.username;
    const hasAuthor = !!selectedAuthor;

    return (
        <div className="min-h-screen text-white bg-gradient-to-br from-red-900 via-red-800 to-red-700">
            <div className="lg:px-24 xs:px-10 py-10 flex flex-col lg:flex-row gap-9">
                <div className="lg:basis-2/3 flex flex-col min-w-0">
                    {/* Red Banner Section */}
                    <div className="bg-[#6F0000] p-8 relative">
                        <Button
                            type="button"
                            variant="ghost"
                            className="absolute top-4 right-4 text-white border-white hover:bg-white/20"
                        >
                            🌐
                            {' '}
                            <span className="hidden sm:inline">Translate</span>
                        </Button>
                        <h1 className="text-3xl font-serif text-white mb-4 uppercase break-words">
                            {getBlogText(formData.title, 'No title')}
                        </h1>
                        <p className="text-xl text-white font-serif italic break-words">
                            {getBlogText(formData.contentSubHeadline || formData.contentHeadline)}
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 bg-black/20 backdrop-blur-sm">
                        <div className="flex gap-4 mb-6 text-gray-300">
                            <span className="text-red-300 font-serif">
                                {new Date().toLocaleDateString()}
                                {' '}
                                by
                                {' '}
                                {getBlogText(formData.authorName || formData.hostName, 'Unknown')}
                            </span>
                        </div>

                        {formData.featuredImage && (
                            <div className="mb-6">
                                <img
                                    src={formData.featuredImage}
                                    alt={getBlogText(formData.title, 'Featured image')}
                                    className="w-full h-64 object-cover rounded-lg shadow-lg"
                                />
                            </div>
                        )}

                        {/* Content Display */}
                        <div className="prose prose-invert max-w-none text-white leading-relaxed text-base">
                            {formData.content
                                ? (
                                        <div className="text-white">
                                            {/* Try LexicalPreview first */}
                                            <LexicalPreview
                                                content={formData.content}
                                                className="text-white prose prose-invert max-w-none bg-transparent p-0 border-0"
                                            />
                                            {/* Simple text fallback for content that doesn't render in Lexical */}
                                            {formData.content && !formData.content.startsWith('{') && (
                                                <div className="mt-2 text-white">
                                                    {formData.content.replace(HTML_TAG_RE, '').substring(0, 1000)}
                                                    {formData.content.length > 1000 && '...'}
                                                </div>
                                            )}
                                        </div>
                                    )
                                : (
                                        <div className="text-gray-400 italic p-4">
                                            No content available for this
                                            {' '}
                                            {isPodcast ? 'podcast' : 'blog post'}
                                            .
                                        </div>
                                    )}
                        </div>

                        {isPodcast && podcastEmbedUrl && (
                            <div className="mt-8">
                                <div className="bg-red-800/40 backdrop-blur-sm p-6 rounded-lg border border-red-600/30">
                                    <iframe
                                        src={podcastEmbedUrl}
                                        title={getBlogText(formData.title, 'Podcast embed')}
                                        frameBorder="0"
                                        allowFullScreen
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        sandbox="allow-scripts allow-same-origin allow-presentation"
                                        className="w-full rounded-lg"
                                        style={{ height: getPodcastEmbedHeight(podcastEmbedUrl) }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Audio Player for Podcast */}
                        {isPodcast && !podcastEmbedUrl && formData.file && (
                            <div className="mt-8">
                                <div className="bg-red-800/40 backdrop-blur-sm p-6 rounded-lg border border-red-600/30">
                                    <div className="flex items-center gap-4 mb-4">
                                        {formData.logo && (
                                            <img
                                                src={formData.logo}
                                                alt="Podcast logo"
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                        )}
                                        <div>
                                            <h3 className="text-white font-semibold">{getBlogText(formData.title)}</h3>
                                            <p className="text-gray-300">{getBlogText(formData.hostName)}</p>
                                        </div>
                                    </div>
                                    <audio controls className="w-full" src={formData.file}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:basis-1/3 flex flex-col gap-9 min-w-0">
                    {/* Promotional Card - Show author profile or website card */}
                    {!formData.isLustEditorial && (hasAuthor || formData.logo || formData.cover) && (
                        <div className="bg-red-800/40 backdrop-blur-sm rounded-lg overflow-hidden border border-red-600/30">
                            {hasAuthor
                                ? (
                                        // Amateur post - show author profile
                                        <>
                                            {authorProfilePicture && (
                                                <img
                                                    src={authorProfilePicture}
                                                    alt={authorUsername || 'Author'}
                                                    className="w-full h-48 object-cover"
                                                />
                                            )}
                                            <div className="p-4">
                                                <a
                                                    href={`https://development.secretswingerlust.com/profile/${authorUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-300 hover:text-blue-200 inline-block"
                                                >
                                                    Visit Profile
                                                </a>
                                            </div>
                                        </>
                                    )
                                : (
                                        // Professional post - show website card
                                        <>
                                            <img
                                                src={formData.logo || formData.cover}
                                                alt="Promotional"
                                                className="w-full h-48 object-cover"
                                            />
                                            {formData.websiteURL && (
                                                <div className="p-4">
                                                    <a
                                                        href={formData.websiteURL}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-300 hover:text-blue-200"
                                                    >
                                                        Visit Website
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    )}
                        </div>
                    )}

                    {/* Blog Categories */}
                    <div className="bg-red-800/40 backdrop-blur-sm p-6 rounded-lg border border-red-600/30">
                        <h3 className="text-white font-semibold mb-4">Categories</h3>
                        <div className="space-y-2">
                            <div className="text-gray-300">
                                {formData.category && (
                                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                                        {formData.category.replace(UNDERSCORE_RE, ' ').toLowerCase().replace(WORD_START_RE, (letter: string) => letter.toUpperCase())}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const FORM_DEFAULT_VALUES = {
    type: E_BlogType.BLOG,
    title: '',
    authorId: '',
    authorName: '',
    websiteName: '',
    websiteURL: '',
    category: E_BlogCategory.TRAVELS,
    featuredImage: '',
    contentHeadline: '',
    contentSubHeadline: '',
    content: '',
    hostName: '',
    languageId: '',
    logo: '',
    cover: '',
    file: '',
    iframe: '',
    socialLinks: [],
    seo: {
        title: '',
        description: '',
        keywords: [],
        socialImage: '',
        socialMediaDescription: '',
        altTextForImages: '',
    },
    isActive: false,
    isLustEditorial: false,
};

export function BlogForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating, fetching }: {
    onCreateSubmit: (data: Input_CreateBlog) => void;
    onUpdateSubmit: (id: string, data: Input_UpdateBlog) => void;
    creating?: boolean;
    updating?: boolean;
    fetching?: boolean;
} & { ref?: Ref<I_BlogFormApi> }) {
    const { t } = useTranslate('blog');
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [currentBlog, setCurrentBlog] = useState<T_Blog | undefined>();
    const formRef = useRef<HTMLFormElement>(null);
    const [uploadTouched, setUploadTouched] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const [websiteDetailsEnabled, setWebsiteDetailsEnabled] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors, isSubmitted },
        reset,
        getValues,
    } = useForm<Partial<T_Blog>>({
        defaultValues: FORM_DEFAULT_VALUES,
        mode: 'onSubmit',
    });

    const { upload } = useUpload();
    const { users } = useGetUsers({}, {
        page: 1,
        limit: 50,
        sort: { username: 1 },
        skip: !isOpen,
    });
    const [featuredImage, setFeaturedImage] = useState<string>('');
    const [logo, setLogo] = useState<string>('');
    const [cover, setCover] = useState<string>('');
    const [file, setFile] = useState<string>('');
    const [socialImage, setSocialImage] = useState<string>('');
    const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [isUploadingSocialImage, setIsUploadingSocialImage] = useState(false);
    const [content, setContent] = useState<string>('');
    const [selectedAuthor, setSelectedAuthor] = useState<T_User | null>(null);
    const type = watch('type');
    const isLustEditorial = watch('isLustEditorial');
    const podcastEmbedUrl = normalizePodcastEmbedUrl(watch('iframe'));

    const BLOG_CATEGORIES = [
        E_BlogCategory.SWINGER_CLUB,
        E_BlogCategory.DATING,
        E_BlogCategory.SEX,
        E_BlogCategory.LIFESTYLE,
        E_BlogCategory.TRAVELS,
    ];
    const PODCAST_CATEGORIES = [
        E_BlogCategory.LIFESTYLE,
        E_BlogCategory.RELATIONSHIPS,
        E_BlogCategory.DATING,
        E_BlogCategory.SEXUALITY,
        E_BlogCategory.TRAVELS,
    ];
    const allowedCategories = type === E_BlogType.PODCAST ? PODCAST_CATEGORIES : BLOG_CATEGORIES;

    function prettifyCategory(cat: E_BlogCategory) {
        if (cat === E_BlogCategory.SWINGER_CLUB)
            return 'Swinger Club';

        if (cat === E_BlogCategory.TRAVELS)
            return 'Travels';

        if (cat === E_BlogCategory.SEXUALITY)
            return 'Sexuality';

        if (cat === E_BlogCategory.RELATIONSHIPS)
            return 'Relationships';

        return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    }

    const currentCategory = watch('category');
    if (currentCategory && !allowedCategories.includes(currentCategory)) {
        setValue('category', allowedCategories[0]);
    }

    const { blogs: allBlogs } = useGetBlogs({}, { page: 1, limit: 1000, skip: !isOpen });
    const { languages, loading: loadingLanguages } = useAllLanguages({ skip: !isOpen });

    const featuredImageDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                try {
                    setIsUploadingFeatured(true);
                    const url = await upload({ type: E_UploadType.IMAGE, entity: E_UploadEntity.USER, entityId: null, file });
                    setFeaturedImage(url);
                    setValue('featuredImage', url);
                }
                catch (error) {
                    console.error('Failed to upload featured image:', error);
                }
                finally {
                    setIsUploadingFeatured(false);
                }
            }
        },
    });
    const logoDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                try {
                    setIsUploadingLogo(true);
                    const url = await upload({ type: E_UploadType.IMAGE, entity: E_UploadEntity.USER, entityId: null, file });
                    setLogo(url);
                    setValue('logo', url);
                }
                catch (error) {
                    console.error('Failed to upload logo:', error);
                }
                finally {
                    setIsUploadingLogo(false);
                }
            }
        },
    });
    const coverDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                try {
                    setIsUploadingCover(true);
                    const url = await upload({ type: E_UploadType.IMAGE, entity: E_UploadEntity.USER, entityId: null, file });
                    setCover(url);
                    setValue('cover', url);
                }
                catch (error) {
                    console.error('Failed to upload cover:', error);
                }
                finally {
                    setIsUploadingCover(false);
                }
            }
        },
    });
    const fileDropzone = useDropzone({
        accept: {},
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                try {
                    setIsUploadingFile(true);
                    const url = await upload({ type: E_UploadType.AUDIO, entity: E_UploadEntity.USER, entityId: null, file });
                    setFile(url);
                    setValue('file', url);
                }
                catch (error) {
                    console.error('Failed to upload file:', error);
                }
                finally {
                    setIsUploadingFile(false);
                }
            }
        },
    });

    const socialImageDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                try {
                    setIsUploadingSocialImage(true);
                    const url = await upload({ type: E_UploadType.IMAGE, entity: E_UploadEntity.USER, entityId: null, file });
                    setSocialImage(url);
                    setValue('seo.socialImage', url);
                }
                catch (error) {
                    console.error('Failed to upload social image:', error);
                }
                finally {
                    setIsUploadingSocialImage(false);
                }
            }
        },
    });

    useImperativeHandle(ref, () => ({
        open: (blog?: T_Blog) => {
            setCurrentBlog(blog);
            setMode(blog ? 'update' : 'create');
            setIsOpen(true);
            if (blog) {
                const formData = {
                    ...FORM_DEFAULT_VALUES,
                    ...blog,
                    title: getBlogFormText(blog.title),
                    authorName: getBlogFormText(blog.authorName),
                    websiteName: getBlogFormText(blog.websiteName),
                    websiteURL: getBlogFormText(blog.websiteURL),
                    featuredImage: getBlogFormText(blog.featuredImage),
                    contentHeadline: getBlogFormText(blog.contentHeadline),
                    contentSubHeadline: getBlogFormText(blog.contentSubHeadline),
                    content: getBlogText(blog.content),
                    hostName: getBlogFormText(blog.hostName),
                    logo: getBlogFormText(blog.logo),
                    cover: getBlogFormText(blog.cover),
                    file: getBlogFormText(blog.file),
                    iframe: getBlogFormText(blog.iframe),
                    seo: blog.seo || FORM_DEFAULT_VALUES.seo,
                };
                reset(formData);
                setFeaturedImage(getBlogFormText(blog.featuredImage));
                setLogo(getBlogFormText(blog.logo));
                setCover(getBlogFormText(blog.cover));
                setFile(getBlogFormText(blog.file));
                setSocialImage(getBlogFormText(blog.seo?.socialImage));
                setContent(getBlogText(blog.content));
                setWebsiteDetailsEnabled(!!(blog.websiteName || blog.websiteURL));
                if (blog.authorId) {
                    const author = users.find(user => user.id === blog.authorId);
                    setSelectedAuthor(author || blog.author || null);
                }
                else {
                    setSelectedAuthor(null);
                }
            }
            else {
                reset(FORM_DEFAULT_VALUES);
                setFeaturedImage('');
                setLogo('');
                setCover('');
                setFile('');
                setSocialImage('');
                setContent('');
                setWebsiteDetailsEnabled(false);
                setSelectedAuthor(null);
            }
        },
        close: () => setIsOpen(false),
    }), [reset, users]);

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
            <DrawerContent className="max-h-screen overflow-y-auto !max-w-4xl">
                <DrawerHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === 'create' ? t('add-blog') : t('update-blog')}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === 'create' ? t('add-blog-description') : t('update-blog-description')}
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className="flex items-center gap-2"
                        >
                            <Eye className="h-4 w-4" />
                            {isPreviewMode ? 'Edit Mode' : 'Preview'}
                        </Button>
                    </div>
                </DrawerHeader>
                <form
                    ref={formRef}
                    onSubmit={handleSubmit((data) => {
                        if (
                            (type === E_BlogType.BLOG && (!featuredImage || (!isLustEditorial && !logo)))
                            || (type === E_BlogType.PODCAST && (!logo || !cover || (!file && !podcastEmbedUrl)))
                        ) {
                            setUploadTouched(true);
                            return;
                        }
                        setUploadTouched(false);
                        const allowedFields: (keyof T_Blog)[] = [
                            'type',
                            'title',
                            'authorId',
                            'authorName',
                            'websiteName',
                            'websiteURL',
                            'category',
                            'featuredImage',
                            'contentHeadline',
                            'contentSubHeadline',
                            'content',
                            'relatedBlogsIds',
                            ...(type === E_BlogType.PODCAST ? ['languageId' as keyof T_Blog] : []),
                            'hostName' as keyof T_Blog,
                            'logo' as keyof T_Blog,
                            'cover' as keyof T_Blog,
                            'file' as keyof T_Blog,
                            'iframe' as keyof T_Blog,
                            'socialLinks' as keyof T_Blog,
                            'seo',
                            'isActive',
                            'isLustEditorial',
                        ];
                        const updateData: Partial<T_Blog> = {};
                        allowedFields.forEach((key) => {
                            if (data[key] !== undefined)
                                (updateData as any)[key] = data[key];
                        });
                        updateData.title = getBlogFormText(updateData.title);
                        updateData.authorName = getBlogFormText(updateData.authorName);
                        updateData.websiteName = getBlogFormText(updateData.websiteName);
                        updateData.websiteURL = getBlogFormText(updateData.websiteURL);
                        updateData.featuredImage = getBlogFormText(updateData.featuredImage);
                        updateData.contentHeadline = getBlogFormText(updateData.contentHeadline);
                        updateData.contentSubHeadline = getBlogFormText(updateData.contentSubHeadline);
                        updateData.content = getBlogText(updateData.content);
                        updateData.hostName = getBlogFormText(updateData.hostName);
                        updateData.logo = getBlogFormText(updateData.logo);
                        updateData.cover = getBlogFormText(updateData.cover);
                        updateData.file = getBlogFormText(updateData.file);
                        updateData.iframe = getBlogFormText(updateData.iframe);
                        if (type === E_BlogType.PODCAST) {
                            if (!updateData.authorId && updateData.hostName) {
                                updateData.authorId = updateData.hostName;
                            }
                            if (!updateData.featuredImage && updateData.cover) {
                                updateData.featuredImage = updateData.cover;
                            }
                        }

                        if (mode === E_FormMode.Update && currentBlog?.id) {
                            const filteredUpdateData = Object.fromEntries(
                                Object.entries(updateData).filter(([_, value]) => value !== undefined),
                            ) as Input_UpdateBlog;
                            onUpdateSubmit(currentBlog.id, filteredUpdateData);
                        }
                        else {
                            const filteredCreateData = Object.fromEntries(
                                Object.entries(updateData).filter(([_, value]) => value !== undefined),
                            ) as Input_CreateBlog;
                            onCreateSubmit(filteredCreateData);
                        }
                        setIsOpen(false);
                    })}
                    className="w-full space-y-10 p-8"
                >
                    {isPreviewMode
                        ? (
                                <BlogPreview formData={getValues()} type={(type || E_BlogType.BLOG) as E_BlogType} selectedAuthor={selectedAuthor} />
                            )
                        : (
                                <>
                                    {/* Basic Info Section */}
                                    <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-purple-200/60 via-pink-100/60 to-blue-100/60 dark:from-purple-900/40 dark:to-blue-900/40 p-8 glassmorphism transition-all hover:scale-[1.01]">
                                        <h3 className="font-bold text-2xl text-purple-700 mb-6 flex items-center gap-3">
                                            <Tag className="w-7 h-7 text-purple-500" />
                                            {t('basic-information')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FloatLabel label={t('type')} required error={typeof errors.type?.message === 'string' ? errors.type.message : undefined}>
                                                <Controller
                                                    name="type"
                                                    control={control}
                                                    rules={{ required: t('error-select-type') }}
                                                    render={({ field }) => (
                                                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('select-type')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={E_BlogType.BLOG}>{t('blog')}</SelectItem>
                                                                <SelectItem value={E_BlogType.PODCAST}>{t('podcast')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </FloatLabel>
                                            <FloatLabel label={t('category')} required error={typeof errors.category?.message === 'string' ? errors.category.message : undefined}>
                                                <Controller
                                                    name="category"
                                                    control={control}
                                                    rules={{ required: t('error-select-category') }}
                                                    render={({ field }) => (
                                                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('select-category')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {allowedCategories.map(cat => (
                                                                    <SelectItem key={cat} value={cat}>{prettifyCategory(cat)}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </FloatLabel>
                                            <FloatLabel label={t('title')} required error={typeof errors.title?.message === 'string' ? errors.title.message : undefined}>
                                                <Input {...register('title', { required: t('required-title') })} placeholder={t('enter-title')} />
                                            </FloatLabel>

                                            {type === E_BlogType.BLOG && (
                                                <FloatLabel label={t('author')} error={typeof errors.authorId?.message === 'string' ? errors.authorId.message : undefined}>
                                                    <Controller
                                                        name="authorId"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <AutocompleteSelect
                                                                options={users.map(user => ({
                                                                    id: user.id || '',
                                                                    name: user.username || 'Unknown',
                                                                    searchText: `${user.username} ${user.email}`.toLowerCase(),
                                                                }))}
                                                                value={field.value || ''}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                    const selectedUser = users.find(user => user.id === value);
                                                                    if (selectedUser) {
                                                                        setValue('authorName', selectedUser.username || '');
                                                                        setSelectedAuthor(selectedUser);
                                                                    }
                                                                    else {
                                                                        setSelectedAuthor(null);
                                                                    }
                                                                }}
                                                                placeholder={t('select-author')}
                                                                className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white/80 dark:bg-gray-700/80 text-purple-700 dark:text-purple-200 backdrop-blur-sm"
                                                                error={!!errors.authorId}
                                                            />
                                                        )}
                                                    />
                                                </FloatLabel>
                                            )}
                                            {type === E_BlogType.PODCAST && (
                                                <FloatLabel label={t('host-name')} required error={typeof errors.hostName?.message === 'string' ? errors.hostName.message : undefined}>
                                                    <Input {...register('hostName', { required: t('required-type') })} placeholder={t('enter-host-name')} />
                                                </FloatLabel>
                                            )}
                                            {type === E_BlogType.PODCAST && (
                                                <FloatLabel label={t('language')} required error={typeof errors.languageId?.message === 'string' ? errors.languageId.message : undefined}>
                                                    <Controller
                                                        name="languageId"
                                                        control={control}
                                                        rules={type === E_BlogType.PODCAST ? { required: t('select-language') } : {}}
                                                        render={({ field }) => (
                                                            <AutocompleteSelect
                                                                options={languages.map(lang => ({
                                                                    id: lang?.id || '',
                                                                    name: `${lang?.name}${lang?.native ? ` (${lang.native})` : ''}`,
                                                                    searchText: `${lang?.name} ${lang?.native} ${lang?.code}`.toLowerCase(),
                                                                }))}
                                                                value={field.value || ''}
                                                                onChange={field.onChange}
                                                                placeholder="Type to search languages..."
                                                                disabled={loadingLanguages}
                                                                className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white/80 dark:bg-gray-700/80 text-purple-700 dark:text-purple-200 backdrop-blur-sm"
                                                                error={!!errors.languageId}
                                                            />
                                                        )}
                                                    />
                                                </FloatLabel>
                                            )}
                                            {/* Website fields with optional toggle */}
                                            <div className="md:col-span-2">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <label className="font-medium text-purple-700 dark:text-purple-200 text-sm">
                                                        {t('website-details')}
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-700 bg-white/70 dark:bg-gray-700/80"
                                                        onClick={() => {
                                                            const newValue = !websiteDetailsEnabled;
                                                            setWebsiteDetailsEnabled(newValue);
                                                            if (!newValue) {
                                                                setValue('websiteName', '');
                                                                setValue('websiteURL', '');
                                                            }
                                                        }}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${websiteDetailsEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                        {websiteDetailsEnabled ? t('enabled') : t('disabled')}
                                                    </Button>
                                                </div>
                                                {websiteDetailsEnabled && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <FloatLabel label={t('website-name')} error={typeof errors.websiteName?.message === 'string' ? errors.websiteName.message : undefined}>
                                                            <Input {...register('websiteName')} placeholder={t('enter-website-name')} />
                                                        </FloatLabel>
                                                        <FloatLabel label={t('website-url')} error={typeof errors.websiteURL?.message === 'string' ? errors.websiteURL.message : undefined}>
                                                            <Input {...register('websiteURL')} placeholder={t('enter-website-url')} />
                                                        </FloatLabel>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Status Toggle */}
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="font-medium text-purple-700 dark:text-purple-200 text-sm">
                                                    {t('status')}
                                                </label>
                                                <Controller
                                                    name="isActive"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-700 bg-white/70 dark:bg-gray-700/80"
                                                            onClick={() => field.onChange(!field.value)}
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${field.value ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                            {field.value ? t('published') : t('draft')}
                                                        </Button>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                    {type === E_BlogType.BLOG && (
                                        <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-pink-100/60 via-purple-50/60 to-blue-50/60 dark:from-pink-900/40 dark:to-blue-900/40 p-8 my-8 glassmorphism transition-all hover:scale-[1.01]">
                                            <h3 className="font-bold text-2xl text-pink-700 mb-6 flex items-center gap-3">
                                                <LinkIcon className="w-7 h-7 text-pink-500" />
                                                {t('related-articles')}
                                            </h3>
                                            <FloatLabel label={t('related-articles')} error={typeof errors.relatedBlogsIds?.message === 'string' ? errors.relatedBlogsIds.message : undefined}>
                                                <Controller
                                                    name="relatedBlogsIds"
                                                    control={control}
                                                    render={({ field }) => {
                                                        const value = Array.isArray(field.value)
                                                            ? field.value.filter((v): v is string => typeof v === 'string' && !!v)
                                                            : [];
                                                        return (
                                                            <div>
                                                                <select
                                                                    multiple
                                                                    className="w-full px-4 py-3 border border-pink-300 dark:border-pink-600 rounded-xl focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-600 bg-white/80 dark:bg-gray-700/80 text-pink-700 dark:text-pink-200 backdrop-blur-sm min-h-[100px] font-semibold"
                                                                    value={value}
                                                                    onChange={(e) => {
                                                                        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                                                                        field.onChange(selected);
                                                                    }}
                                                                >
                                                                    {allBlogs && allBlogs.length > 0
                                                                        ? allBlogs
                                                                                .filter(b => !currentBlog || b.id !== currentBlog.id)
                                                                                .map((blog) => {
                                                                                    const blogId = String(blog.id);
                                                                                    return (
                                                                                        <option
                                                                                            key={blogId}
                                                                                            value={blogId}
                                                                                            style={{
                                                                                                color: '#db2777',
                                                                                                background: value.includes(blogId) ? '#fce7f3' : 'white',
                                                                                                fontWeight: value.includes(blogId) ? 'bold' : 'normal',
                                                                                                borderRadius: '0.5rem',
                                                                                                padding: '0.5rem',
                                                                                            }}
                                                                                        >
                                                                                            {getBlogText(blog.title)}
                                                                                        </option>
                                                                                    );
                                                                                })
                                                                        : <option value="" disabled>No blogs found</option>}
                                                                </select>
                                                                <span className="text-xs text-gray-500 mt-1 block">Hold Ctrl (Windows) or Command (Mac) to select multiple articles</span>
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            </FloatLabel>
                                        </motion.div>
                                    )}
                                    {/* Content Section */}
                                    <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-blue-200/60 via-cyan-100/60 to-indigo-100/60 dark:from-blue-900/40 dark:to-indigo-900/40 p-8 glassmorphism transition-all hover:scale-[1.01]">
                                        <h3 className="font-bold text-2xl text-blue-700 mb-6 flex items-center gap-3">
                                            <FileText className="w-7 h-7 text-blue-500" />
                                            {t('content')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FloatLabel label={t('headline')} required error={typeof errors.contentHeadline?.message === 'string' ? errors.contentHeadline.message : undefined}>
                                                <Input {...register('contentHeadline', { required: t('required-headline') })} placeholder={t('headline')} />
                                            </FloatLabel>
                                            <FloatLabel label={t('sub-headline')} error={typeof errors.contentSubHeadline?.message === 'string' ? errors.contentSubHeadline.message : undefined}>
                                                <Input {...register('contentSubHeadline', { required: t('required-sub-headline') })} placeholder={t('sub-headline')} />
                                            </FloatLabel>
                                        </div>
                                        <div className="col-span-full">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">
                                                    {t('main-content')}
                                                    {' '}
                                                    *
                                                </label>
                                                <Editor
                                                    value={content}
                                                    onChange={(value) => {
                                                        setContent(value);
                                                        setValue('content', value, { shouldValidate: true });
                                                    }}
                                                    valueKey={currentBlog?.id ?? 'new'}
                                                    placeholder={t('write-content')}
                                                    showToolbar={true}
                                                    className="border border-gray-300 dark:border-gray-600 rounded-xl"
                                                    contentClassName="min-h-[300px] outline-none p-4 text-gray-900 dark:text-gray-100"
                                                />
                                                <input
                                                    type="hidden"
                                                    {...register('content', {
                                                        required: t('required-content'),
                                                        validate: (value) => {
                                                            if (!value)
                                                                return t('required-content');
                                                            try {
                                                                const parsed = JSON.parse(value);
                                                                const extractText = (node: any): string => {
                                                                    if (node.text)
                                                                        return node.text;
                                                                    if (node.children)
                                                                        return node.children.map(extractText).join('');
                                                                    return '';
                                                                };
                                                                const text = extractText(parsed.root).trim();
                                                                if (!text)
                                                                    return t('required-content');
                                                            }
                                                            catch {
                                                                if (!value.trim())
                                                                    return t('required-content');
                                                            }
                                                            return true;
                                                        },
                                                    })}
                                                />
                                                {errors.content && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {typeof errors.content.message === 'string' ? errors.content.message : t('required-content')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                    {/* Media Section */}
                                    <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-green-200/60 via-lime-100/60 to-emerald-100/60 dark:from-green-900/40 dark:to-emerald-900/40 p-8 glassmorphism transition-all hover:scale-[1.01]">
                                        <h3 className="font-bold text-2xl text-green-700 mb-6 flex items-center gap-3">
                                            <Upload className="w-7 h-7 text-green-500" />
                                            {t('media-images')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {type === E_BlogType.BLOG && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-green-700">{t('featured-image')}</label>
                                                    {isUploadingFeatured
                                                        ? (
                                                                <div className="w-full h-40 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-600 animate-pulse">
                                                                    Uploading featured image...
                                                                </div>
                                                            )
                                                        : featuredImage
                                                            ? (
                                                                    <div className="relative">
                                                                        <img src={featuredImage} alt="Featured" className="w-full h-40 object-cover rounded-xl" />
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setFeaturedImage('');
                                                                                setValue('featuredImage', '');
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                                        >
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            : (
                                                                    <div {...featuredImageDropzone.getRootProps()} className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center cursor-pointer hover:border-green-600">
                                                                        <input {...featuredImageDropzone.getInputProps()} />
                                                                        <Upload className="mx-auto text-green-400 mb-2" size={32} />
                                                                        <p className="text-green-600">{t('upload-image')}</p>
                                                                    </div>
                                                                )}
                                                    {(isSubmitted || uploadTouched) && !featuredImage && (
                                                        <span className="text-red-500 text-xs">{t('required-field')}</span>
                                                    )}
                                                </div>
                                            )}
                                            {type === E_BlogType.BLOG && !isLustEditorial && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-green-700">{t('logo')}</label>
                                                    {isUploadingLogo
                                                        ? (
                                                                <div className="w-full h-40 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-600 animate-pulse">
                                                                    Uploading logo...
                                                                </div>
                                                            )
                                                        : logo
                                                            ? (
                                                                    <div className="relative">
                                                                        <img src={logo} alt="Logo" className="w-full h-40 object-cover rounded-xl" />
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setLogo('');
                                                                                setValue('logo', '');
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                                        >
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            : (
                                                                    <div {...logoDropzone.getRootProps()} className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center cursor-pointer hover:border-green-600">
                                                                        <input {...logoDropzone.getInputProps()} />
                                                                        <Upload className="mx-auto text-green-400 mb-2" size={32} />
                                                                        <p className="text-green-600">{t('upload-logo')}</p>
                                                                    </div>
                                                                )}
                                                    {(isSubmitted || uploadTouched) && !logo && (
                                                        <span className="text-red-500 text-xs">{t('required-field')}</span>
                                                    )}
                                                </div>
                                            )}
                                            {type === E_BlogType.PODCAST && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-green-700">{t('logo')}</label>
                                                        {logo
                                                            ? (
                                                                    <div className="relative">
                                                                        <img src={logo} alt="Logo" className="w-full h-32 object-cover rounded-xl" />
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setLogo('');
                                                                                setValue('logo', '');
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                                        >
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            : (
                                                                    <div {...logoDropzone.getRootProps()} className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center cursor-pointer hover:border-green-600">
                                                                        <input {...logoDropzone.getInputProps()} />
                                                                        <Upload className="mx-auto text-green-400 mb-2" size={32} />
                                                                        <p className="text-green-600">{t('upload-logo')}</p>
                                                                    </div>
                                                                )}
                                                        {(isSubmitted || uploadTouched) && !logo && (
                                                            <span className="text-red-500 text-xs">{t('required-field')}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-green-700">{t('cover')}</label>
                                                        {isUploadingCover
                                                            ? (
                                                                    <div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-600 animate-pulse">
                                                                        Uploading cover...
                                                                    </div>
                                                                )
                                                            : cover
                                                                ? (
                                                                        <div className="relative">
                                                                            <img src={cover} alt="Cover" className="w-full h-32 object-cover rounded-xl" />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                onClick={() => {
                                                                                    setCover('');
                                                                                    setValue('cover', '');
                                                                                }}
                                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                                            >
                                                                                <X size={16} />
                                                                            </Button>
                                                                        </div>
                                                                    )
                                                                : (
                                                                        <div {...coverDropzone.getRootProps()} className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center cursor-pointer hover:border-green-600">
                                                                            <input {...coverDropzone.getInputProps()} />
                                                                            <Upload className="mx-auto text-green-400 mb-2" size={32} />
                                                                            <p className="text-green-600">{t('upload-cover')}</p>
                                                                        </div>
                                                                    )}
                                                        {(isSubmitted || uploadTouched) && !cover && (
                                                            <span className="text-red-500 text-xs">{t('required-field')}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-green-700">{t('file')}</label>
                                                        {isUploadingFile
                                                            ? (
                                                                    <div className="w-full h-28 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-600 animate-pulse">
                                                                        Uploading file...
                                                                    </div>
                                                                )
                                                            : file
                                                                ? (
                                                                        <div className="relative">
                                                                            <audio controls src={file} className="w-full rounded-xl" />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                onClick={() => {
                                                                                    setFile('');
                                                                                    setValue('file', '');
                                                                                }}
                                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                                            >
                                                                                <X size={16} />
                                                                            </Button>
                                                                        </div>
                                                                    )
                                                                : (
                                                                        <div {...fileDropzone.getRootProps()} className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center cursor-pointer hover:border-green-600">
                                                                            <input {...fileDropzone.getInputProps()} />
                                                                            <Upload className="mx-auto text-green-400 mb-2" size={32} />
                                                                            <p className="text-green-600">{t('upload-file')}</p>
                                                                        </div>
                                                                    )}
                                                        {(isSubmitted || uploadTouched) && !file && !podcastEmbedUrl && (
                                                            <span className="text-red-500 text-xs">Upload a file or provide an embed URL.</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-green-700">Podcast Player URL</label>
                                                        <Input
                                                            {...register('iframe')}
                                                            placeholder="https://open.spotify.com/episode/... or https://youtu.be/..."
                                                        />
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            Accepted sources: Bunny, YouTube, Vimeo, Spotify, Apple Podcasts. Do not paste raw iframe HTML.
                                                        </p>
                                                        {(isSubmitted || uploadTouched) && !file && !podcastEmbedUrl && (
                                                            <span className="text-red-500 text-xs">Upload a file or provide an embed URL.</span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                    {/* Social Media Links Section */}
                                    <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-pink-200/60 via-purple-100/60 to-blue-100/60 dark:from-pink-900/40 dark:to-blue-900/40 p-8 glassmorphism transition-all hover:scale-[1.01]">
                                        <BlogSocialLinks
                                            socialLinks={(getValues().socialLinks ?? []).filter(
                                                (l): l is { type: E_SocialPlatform; url: string } => !!l && !!l.type,
                                            )}
                                            onSocialLinksChange={(links) => {
                                                setValue('socialLinks', links.map(({ type, url }) => ({ type, url })) as T_SocialLink[]);
                                            }}
                                        />
                                    </motion.div>
                                    {/* SEO Section */}
                                    <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-indigo-200/60 via-purple-100/60 to-pink-100/60 dark:from-indigo-900/40 dark:to-pink-900/40 p-8 glassmorphism transition-all hover:scale-[1.01]">
                                        <h3 className="font-bold text-2xl text-indigo-700 mb-6 flex items-center gap-3">
                                            <Settings className="w-7 h-7 text-indigo-500" />
                                            {t('seo-settings')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FloatLabel label={t('seo-title')} error={typeof errors.seo?.title === 'object' && typeof errors.seo.title.message === 'string' ? errors.seo.title.message : undefined}>
                                                <Controller
                                                    name="seo.title"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input {...field} type="text" placeholder={t('enter-seo-title')} aria-invalid={!!errors.seo?.title} value={field.value ?? ''} />
                                                    )}
                                                />
                                            </FloatLabel>
                                            <FloatLabel label={t('seo-description')} error={typeof errors.seo?.description === 'object' && typeof errors.seo.description.message === 'string' ? errors.seo.description.message : undefined}>
                                                <Controller
                                                    name="seo.description"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input {...field} value={field.value ?? ''} placeholder={t('enter-seo-description')} />
                                                    )}
                                                />
                                            </FloatLabel>
                                            <FloatLabel label={t('seo-keywords')} error={typeof errors.seo?.keywords === 'object' && typeof errors.seo.keywords.message === 'string' ? errors.seo.keywords.message : undefined}>
                                                <Controller
                                                    name="seo.keywords"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            value={Array.isArray(field.value) ? field.value.filter(Boolean).join(', ') : field.value ?? ''}
                                                            placeholder={t('enter-seo-keywords')}
                                                        />
                                                    )}
                                                />
                                            </FloatLabel>
                                            <FloatLabel label={t('social-media-description')} error={typeof errors.seo?.socialMediaDescription === 'object' && typeof errors.seo.socialMediaDescription.message === 'string' ? errors.seo.socialMediaDescription.message : undefined}>
                                                <Controller
                                                    name="seo.socialMediaDescription"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input {...field} value={field.value ?? ''} placeholder={t('enter-social-media-description')} />
                                                    )}
                                                />
                                            </FloatLabel>
                                            <FloatLabel label={t('alt-text-for-images')} error={typeof errors.seo?.altTextForImages === 'object' && typeof errors.seo.altTextForImages.message === 'string' ? errors.seo.altTextForImages.message : undefined}>
                                                <Controller
                                                    name="seo.altTextForImages"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input {...field} value={field.value ?? ''} placeholder={t('enter-alt-text-for-images')} />
                                                    )}
                                                />
                                            </FloatLabel>

                                            {/* Social Share Image Upload */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-2 text-indigo-700 dark:text-indigo-200">
                                                    {t('social-share-image')}
                                                </label>
                                                {isUploadingSocialImage
                                                    ? (
                                                            <div className="w-full h-40 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-center text-sm text-indigo-600 animate-pulse">
                                                                Uploading social image...
                                                            </div>
                                                        )
                                                    : socialImage
                                                        ? (
                                                                <div className="relative">
                                                                    <img
                                                                        src={socialImage}
                                                                        alt="Social Share"
                                                                        className="w-full h-40 object-cover rounded-xl border-2 border-indigo-200"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            setSocialImage('');
                                                                            setValue('seo.socialImage', '');
                                                                        }}
                                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                                    >
                                                                        <X size={16} />
                                                                    </Button>
                                                                </div>
                                                            )
                                                        : (
                                                                <div {...socialImageDropzone.getRootProps()} className="border-2 border-dashed border-indigo-400 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20">
                                                                    <input {...socialImageDropzone.getInputProps()} />
                                                                    <Upload className="mx-auto text-indigo-400 mb-2" size={32} />
                                                                    <p className="text-indigo-600 dark:text-indigo-300 font-medium">{t('upload-social-image')}</p>
                                                                    <p className="text-xs text-indigo-500 mt-1">
                                                                        {t('recommended-size')}
                                                                        : 1200x630px
                                                                    </p>
                                                                </div>
                                                            )}
                                            </div>
                                        </div>
                                    </motion.div>
                                    {/* Lust Editorial Toggle */}
                                    <motion.div className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-orange-200/60 via-yellow-100/60 to-red-100/60 dark:from-orange-900/40 dark:to-red-900/40 p-8 glassmorphism transition-all hover:scale-[1.01]">
                                        <h3 className="font-bold text-2xl text-orange-700 mb-6 flex items-center gap-3">
                                            <Settings className="w-7 h-7 text-orange-500" />
                                            {t('lust-editorial-settings')}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <label className="font-medium text-orange-700 dark:text-orange-200 text-lg">
                                                {t('lust-editorial')}
                                            </label>
                                            <Controller
                                                name="isLustEditorial"
                                                control={control}
                                                render={({ field }) => (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-700 bg-white/70 dark:bg-gray-700/80"
                                                        onClick={() => {
                                                            const newValue = !field.value;
                                                            field.onChange(newValue);
                                                            if (newValue && type === E_BlogType.BLOG) {
                                                                setLogo('');
                                                                setValue('logo', '');
                                                            }
                                                        }}
                                                    >
                                                        <span className={`w-3 h-3 rounded-full ${field.value ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                                        {field.value ? t('enabled') : t('disabled')}
                                                    </Button>
                                                )}
                                            />
                                        </div>
                                        <p className="text-sm text-orange-600 dark:text-orange-300 mt-2">
                                            {t('lust-editorial-description')}
                                        </p>
                                    </motion.div>
                                    <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl px-8 py-3 text-lg">
                                            {t('cancel')}
                                        </Button>
                                        <Button type="submit" disabled={creating || updating} className="font-bold rounded-xl px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl hover:from-pink-500 hover:to-purple-600 transition-all">
                                            <Save className="h-5 w-5 mr-3" />
                                            {mode === 'create' ? t('save-blog-post') : t('update-blog')}
                                        </Button>
                                    </div>
                                </>
                            )}
                    {fetching && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                                <p className="text-purple-600 dark:text-purple-400 font-semibold">{t('loading-blog-details') || 'Loading blog details...'}</p>
                            </div>
                        </div>
                    )}
                </form>
            </DrawerContent>
        </Drawer>
    );
}
