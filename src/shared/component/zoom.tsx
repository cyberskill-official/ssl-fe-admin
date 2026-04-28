import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogOverlay,
    Image,
} from '#shared/component';

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
    const [zoomed, setZoomed] = useState(false);
    const [hasError, setHasError] = useState(false);

    const fallbackSrc = '/images/placeholder.png';
    const fallbackAlt = 'Image not available';

    const showSrc = hasError ? fallbackSrc : src;
    const showAlt = hasError ? fallbackAlt : alt || fallbackAlt;

    return (
        <>
            <div
                onClick={() => setZoomed(true)}
                className="cursor-zoom-in w-full overflow-hidden border border-border rounded h-36 bg-gray-100 flex items-center justify-center"
            >
                <Image
                    src={showSrc}
                    alt={showAlt}
                    onError={() => setHasError(true)}
                    className="h-full w-full object-cover"
                />
            </div>
            <Dialog open={zoomed} onOpenChange={setZoomed}>
                <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
                <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-0 rounded-xl overflow-hidden w-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                    <Image
                        src={src}
                        alt={alt || fallbackAlt}
                        className="w-auto h-auto max-w-full max-h-full object-contain"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
