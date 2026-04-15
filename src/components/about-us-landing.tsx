import Image from 'next/image';
import type { AboutUsModule } from '@/types/about-us';

type Props = {
  moduleDoc: AboutUsModule | null;
};

export function AboutUsLandingSection({ moduleDoc }: Props) {
  if (!moduleDoc) return null;
  const title = moduleDoc.title?.trim() || '';
  const description = moduleDoc.description?.trim() || '';
  const image1 = moduleDoc.image1Url;
  const image2 = moduleDoc.image2Url;

  if (!title && !description && !image1 && !image2) return null;

  return (
    <section className="py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.9fr] lg:items-center">
        <div className="flex flex-col">
          <div className="relative h-96 w-full overflow-hidden bg-muted">
            {image1 ? (
              <Image
                src={image1}
                alt="About us"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 34vw, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
            )}
          </div>

          <div className="-mt-16 w-2/3 self-end">
            <div className="relative h-56 overflow-hidden bg-muted shadow-md">
              {image2 ? (
                <Image
                  src={image2}
                  alt="About us"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 24vw, 70vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
              )}
            </div>
          </div>

          <div className="mt-16">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-4 text-sm font-semibold text-white"
            >
              DISCOVER MORE
              <span className="ml-4">—</span>
            </button>
          </div>
        </div>

        <div className="bg-muted p-10 lg:p-14 lg:rounded-[40px]">
          <p className="text-5xl font-semibold tracking-tight text-foreground">About us</p>
          <p
            className="mt-4 text-5xl font-semibold leading-tight text-foreground/20"
            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.12)', color: 'transparent' }}
          >
            {title}
          </p>

          <div className="mt-10 space-y-6 text-base leading-relaxed text-foreground/80 whitespace-pre-line">
            {description}
          </div>
        </div>
      </div>
    </section>
  );
}
