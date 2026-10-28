// Placeholder photography of premium Lagos architecture, used until the business uploads its own.
// Every image is free to use under the Unsplash License (https://unsplash.com/license) — verified
// on each photo's Unsplash page. Credits are shown discreetly beside each image as good practice.
//
// IMPORTANT: these are illustrative area/skyline images for page backgrounds and section art only.
// They are never used as photographs of a listed property.

export type StockImage = {
  key: string;
  id: string; // images.unsplash.com asset id
  alt: string;
  location: string;
  photographer: string;
  photoPage: string;
};

export const STOCK_IMAGES = {
  victoriaIslandTowers: {
    key: "victoriaIslandTowers",
    id: "photo-1572727850654-f50a7ead20df",
    alt: "High-rise towers and boulevard on Victoria Island, Lagos",
    location: "Victoria Island, Lagos",
    photographer: "Olawale Munna",
    photoPage: "https://unsplash.com/photos/imfDeYW-YQY",
  },
  victoriaIslandSkyline: {
    key: "victoriaIslandSkyline",
    id: "photo-1728597476224-1843cf5384f2",
    alt: "Cityscape of Victoria Island, Lagos",
    location: "Victoria Island, Lagos",
    photographer: "Namnso Ukpanah",
    photoPage: "https://unsplash.com/photos/gff8Y7MBTEE",
  },
  lekkiAerial: {
    key: "lekkiAerial",
    id: "photo-1618828665011-0abd973f7bb8",
    alt: "Aerial view of modern buildings in Lekki, Lagos",
    location: "Lekki, Lagos",
    photographer: "Nupo Deyon Daniel",
    photoPage: "https://unsplash.com/photos/67ruAEYmp4c",
  },
  ikoyiRooftops: {
    key: "ikoyiRooftops",
    id: "photo-1594538756542-8c88bda491c5",
    alt: "Aerial view of residential rooftops near Okotie Eboh Street, Ikoyi, Lagos",
    location: "Ikoyi, Lagos",
    photographer: "Obinna Okerekeocha",
    photoPage: "https://unsplash.com/photos/fGd8paHzN98",
  },
  lagosHighRise: {
    key: "lagosHighRise",
    id: "photo-1543414758-63906835c16b",
    alt: "White and bronze high-rise building in Lagos",
    location: "Lagos",
    photographer: "Structures of Lagos",
    photoPage: "https://unsplash.com/photos/ccgKsI2_Tbc",
  },
  lagosWhiteTower: {
    key: "lagosWhiteTower",
    id: "photo-1543414347-1c348021f279",
    alt: "White contemporary high-rise against a blue sky in Lagos",
    location: "Lagos",
    photographer: "Structures of Lagos",
    photoPage: "https://unsplash.com/photos/Ci8ii21QSlk",
  },
} satisfies Record<string, StockImage>;

export type StockKey = keyof typeof STOCK_IMAGES;

/** Path of the self-hosted copy (downloaded by `npm run images:fetch` into /public). */
export function localPath(img: StockImage): string {
  return `/images/lagos/${img.key}.jpg`;
}

/** Remote fallback on Unsplash's CDN, used only until the local copy exists. */
export function remoteUrl(img: StockImage, opts: { w?: number } = {}): string {
  return `https://images.unsplash.com/${img.id}?auto=format&fit=crop${opts.w ? `&w=${opts.w}` : "&w=2400"}&q=80`;
}

/** Which placeholder each page/section uses. Change here to re-art-direct the site. */
export const PAGE_IMAGES = {
  home: STOCK_IMAGES.victoriaIslandTowers,
  properties: STOCK_IMAGES.victoriaIslandSkyline,
  rentAndLease: STOCK_IMAGES.lagosWhiteTower,
  landAndCommercial: STOCK_IMAGES.lekkiAerial,
  investment: STOCK_IMAGES.victoriaIslandSkyline,
  international: STOCK_IMAGES.victoriaIslandTowers,
  about: STOCK_IMAGES.lagosHighRise,
  services: STOCK_IMAGES.lagosHighRise,
  contact: STOCK_IMAGES.ikoyiRooftops,
  insights: STOCK_IMAGES.ikoyiRooftops,
  listYourProperty: STOCK_IMAGES.lekkiAerial,
  faq: STOCK_IMAGES.lagosWhiteTower,
  areas: STOCK_IMAGES.ikoyiRooftops,
  internationalBand: STOCK_IMAGES.lagosWhiteTower,
  approach: STOCK_IMAGES.lagosHighRise,
} as const;

/** Homepage category cards, in order: residential, commercial, land & development, investment. */
export const CATEGORY_IMAGES: StockImage[] = [
  STOCK_IMAGES.ikoyiRooftops,
  STOCK_IMAGES.lagosHighRise,
  STOCK_IMAGES.lekkiAerial,
  STOCK_IMAGES.victoriaIslandSkyline,
];

/** Rotating covers for articles that have no cover image yet. */
export const ARTICLE_FALLBACKS: StockImage[] = [
  STOCK_IMAGES.victoriaIslandSkyline,
  STOCK_IMAGES.ikoyiRooftops,
  STOCK_IMAGES.lekkiAerial,
  STOCK_IMAGES.lagosWhiteTower,
];

export function articleFallback(slug: string): StockImage {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ARTICLE_FALLBACKS[h % ARTICLE_FALLBACKS.length]!;
}
