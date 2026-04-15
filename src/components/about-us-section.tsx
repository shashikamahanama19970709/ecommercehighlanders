import Image from 'next/image';
import type { AboutUsModule } from '@/types/about-us';

type Props = {
  moduleDoc: AboutUsModule | null;
};

export function AboutUsSection({ moduleDoc }: Props) {
  if (!moduleDoc?.title || !moduleDoc?.description) return null;

  const paragraphs = moduleDoc.description
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="bg-background py-16">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-center">
          <div className="flex flex-col">
            {/* Big image */}
            <div className="relative h-96 w-full overflow-hidden bg-muted">
              {moduleDoc.image1Url ? (
                <Image
                  src={moduleDoc.image1Url}
                  alt="About Sportify-Ecommerce"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 34vw, 100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {/* Small overlay image */}
            <div className="-mt-20 w-2/3 self-end overflow-hidden bg-muted shadow-lg">
              <div className="relative h-56">
                {moduleDoc.image2Url ? (
                  <Image
                    src={moduleDoc.image2Url}
                    alt="Sportify-Ecommerce store"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 26vw, 70vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted p-10 lg:p-12">
            <p className="text-sm font-semibold tracking-wide text-foreground">About us</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {moduleDoc.title}
            </h2>

            <div className="mt-6 space-y-5 text-sm leading-7 text-foreground/80">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
