export type LandingHeroBannerEntry = {
  sport: string | { _id: string; name: string };
  videoKey?: string;
  videoUrl?: string;
};

export type LandingHeroBannerModule = {
  moduleName?: 'landing-hero-banner';
  entries: LandingHeroBannerEntry[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
