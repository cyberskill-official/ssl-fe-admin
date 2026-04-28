import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import type { ReactElement } from 'react';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';

export type SerializedVideoNode = Spread<
    {
        src: string;
        width?: number;
        height?: number;
        title?: string;
        altText?: string;
        type: 'video';
        version: 1;
    },
    SerializedLexicalNode
>;

function convertVideoElement(domNode: Node): null | DOMConversionOutput {
    if (domNode instanceof HTMLIFrameElement || domNode instanceof HTMLVideoElement) {
        const src = domNode.getAttribute('src');
        if (src) {
            const node = $createVideoNode(src);
            return { node };
        }
    }
    return null;
}

export class VideoNode extends DecoratorNode<ReactElement> {
    __src: string;
    __width?: number;
    __height?: number;
    __title?: string;
    __altText?: string;

    static override getType(): string {
        return 'video';
    }

    static override clone(node: VideoNode): VideoNode {
        return new VideoNode(
            node.__src,
            node.__width,
            node.__height,
            node.__title,
            node.__altText,
            node.__key,
        );
    }

    static override importJSON(serializedNode: SerializedVideoNode): VideoNode {
        const { src, width, height, title, altText } = serializedNode;
        const node = $createVideoNode(src, width, height, title, altText);
        return node;
    }

    override exportDOM(): DOMExportOutput {
        const element = document.createElement('iframe');
        element.setAttribute('src', this.__src);
        element.setAttribute('frameborder', '0');
        element.setAttribute('allowfullscreen', 'true');
        if (this.__width) {
            element.setAttribute('width', this.__width.toString());
        }
        if (this.__height) {
            element.setAttribute('height', this.__height.toString());
        }
        if (this.__title) {
            element.setAttribute('title', this.__title);
        }
        return { element };
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            iframe: (_node: Node) => ({
                conversion: convertVideoElement,
                priority: 1,
            }),
            video: (_node: Node) => ({
                conversion: convertVideoElement,
                priority: 1,
            }),
        };
    }

    constructor(
        src: string,
        width?: number,
        height?: number,
        title?: string,
        altText?: string,
        key?: NodeKey,
    ) {
        super(key);
        this.__src = src;
        this.__width = width;
        this.__height = height;
        this.__title = title;
        this.__altText = altText;
    }

    override exportJSON(): SerializedVideoNode {
        return {
            src: this.getSrc(),
            width: this.__width,
            height: this.__height,
            title: this.__title,
            altText: this.__altText,
            type: 'video',
            version: 1,
        };
    }

    getSrc(): string {
        return this.__src;
    }

    setSrc(src: string): void {
        const writable = this.getWritable();
        writable.__src = src;
    }

    getWidth(): number | undefined {
        return this.__width;
    }

    setWidth(width: number): void {
        const writable = this.getWritable();
        writable.__width = width;
    }

    getHeight(): number | undefined {
        return this.__height;
    }

    setHeight(height: number): void {
        const writable = this.getWritable();
        writable.__height = height;
    }

    getTitle(): string | undefined {
        return this.__title;
    }

    setTitle(title: string): void {
        const writable = this.getWritable();
        writable.__title = title;
    }

    getAltText(): string | undefined {
        return this.__altText;
    }

    setAltText(altText: string): void {
        const writable = this.getWritable();
        writable.__altText = altText;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme['video'];
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    override updateDOM(): false {
        return false;
    }

    isVideoFile(src: string): boolean {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
        return videoExtensions.some(ext => src.toLowerCase().includes(ext));
    }

    isEmbedVideo(src: string): boolean {
        return (
            src.includes('youtube.com')
            || src.includes('youtu.be')
            || src.includes('vimeo.com')
            || src.includes('mediadelivery.net')
            || src.includes('iframe.mediadelivery.net')
        );
    }

    getEmbedSrc(src: string): string {
        if (src.includes('youtube.com/watch')) {
            const videoId = src.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (src.includes('youtu.be/')) {
            const videoId = src.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (src.includes('vimeo.com/')) {
            const videoId = src.split('vimeo.com/')[1];
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return src;
    }

    override decorate(): ReactElement {
        const src = this.getSrc();
        const width = this.getWidth() || 560;
        const height = this.getHeight() || 315;
        const title = this.getTitle() || 'Video';
        const altText = this.getAltText();

        if (this.isEmbedVideo(src)) {
            const embedSrc = this.getEmbedSrc(src);
            return (
                <iframe
                    src={embedSrc}
                    width={width}
                    height={height}
                    title={title}
                    frameBorder="0"
                    allowFullScreen
                    // eslint-disable-next-line react-dom/no-unsafe-iframe-sandbox
                    sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
                    // allow common features for embedded players (autoplay/fullscreen/encrypted-media)
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    style={{
                        border: 'none',
                        borderRadius: '8px',
                        maxWidth: '100%',
                    }}
                />
            );
        }

        // For uploaded video files or direct video URLs
        return (
            <video
                src={src}
                width={width}
                height={height}
                title={title}
                controls
                style={{
                    border: 'none',
                    borderRadius: '8px',
                    maxWidth: '100%',
                }}
            >
                {altText && <track kind="captions" label={altText} />}
                Your browser does not support the video tag.
            </video>
        );
    }
}

export function $createVideoNode(
    src: string,
    width?: number,
    height?: number,
    title?: string,
    altText?: string,
): VideoNode {
    return $applyNodeReplacement(new VideoNode(src, width, height, title, altText));
}

export function $isVideoNode(
    node: LexicalNode | null | undefined,
): node is VideoNode {
    return node instanceof VideoNode;
}
