// Seeds Adam Chellvan Properties and Investment's approved brand copy (from the client brief),
// structural taxonomy, service pages and DRAFT guide articles for review.
//
// It deliberately creates NO listings, locations, testimonials, contact details, credentials or
// performance claims — those must be supplied and verified by the business.
// Safe to re-run: existing records are never overwritten.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── Brand copy (from the client's brief) ───
const SETTINGS = {
  companyName: "Adam Chellvan Properties and Investment",
  brandPrimary: "Adam Chellvan",
  brandSecondary: "Properties and Investment",
  slogan: "Beyond Property. Towards Prosperity.",
  shortDescription:
    "A property sourcing and real estate solutions partner focused on professional service, informed decisions, transparency, and long-term value — serving clients in Nigeria and investors abroad.",
  heroEyebrow: "Beyond Property. Towards Prosperity.",
  heroHeadline: "Discover Property. Evaluate Opportunities. Make Informed Decisions.",
  heroSubtext:
    "Explore residential, commercial, land, and investment property opportunities in Nigeria with a real estate partner focused on professional service, transparent communication, and your property goals.",
  heroSearchHeading: "Find your next property",
  heroSearchText: "Search by location, property type, budget, and purpose.",
  servicesStrip: "Buy · Sell · Rent · Lease · Invest · Source",
  introHeading: "Real Estate Solutions for Every Stage of Your Journey",
  introBody:
    "Whether you are searching for a home, acquiring land, expanding your business, selling an asset, or exploring opportunities in the Nigerian property market from abroad, we aim to help you navigate the process with greater clarity and confidence.",
  categoryCards: [
    "Residential Properties: Homes, apartments, duplexes, and residential developments.",
    "Commercial Properties: Offices, retail spaces, warehouses, and business premises.",
    "Land and Development: Land acquisition and property sourcing for development.",
    "Investment Opportunities: Property sourcing and support evaluating real estate opportunities.",
  ].join("\n"),
  approachHeading: "A More Informed Approach to Property",
  approachBody:
    "Our approach is built around understanding client requirements, identifying relevant property options, communicating important details, and supporting the steps involved in a property transaction.",
  differentiators: [
    "Client-focused property sourcing",
    "Professional communication and negotiation",
    "Attention to property documentation and due diligence coordination",
    "Support for domestic and international enquiries",
  ].join("\n"),
  internationalHeading: "Investing in Nigeria from Abroad?",
  internationalBody:
    "Explore property opportunities in Nigeria with a clearer understanding of the location, listing details, transaction process, and questions to address before committing.",
  internationalCtaText: "Request sourcing assistance or an investor consultation.",
  ctaHeading: "Let Us Help You Find the Right Opportunity",
  ctaBody:
    "Tell us your preferred location, property type, budget, and goals. Our team can review your requirements and respond with suitable options where available.",
  insightsHeading: "Property insights & guides",
  insightsBody: "Property education, market guides, and investment explainers for buyers, owners and investors.",
  aboutStory: [
    "Adam Chellvan Properties and Investment is a property sourcing and real estate solutions partner serving buyers, sellers, landlords, tenants, developers, and investors in Nigeria — including Nigerians in the diaspora and other international clients interested in the Nigerian property market.",
    "We focus on professional service, informed decisions, transparency, and long-term value. Our work is built around understanding what each client needs, identifying relevant property options, communicating important details clearly, and supporting the steps involved in a property transaction.",
    "[ADD: company history, founder profile, team, and verified credentials — only what can be confirmed.]",
  ].join("\n\n"),
  mission: "[MISSION STATEMENT — to be confirmed by the business]",
  vision: "[VISION STATEMENT — to be confirmed by the business]",
  values: [
    "Professional service: Clear, responsive and respectful communication at every stage.",
    "Transparency: Important details are shared openly so clients can make informed decisions.",
    "Informed decisions: We help clients understand locations, listing details and the questions to ask.",
    "Long-term value: We focus on outcomes that serve our clients' goals beyond a single transaction.",
  ].join("\n"),
  listingDisclaimer:
    "Property details, prices and availability are provided for information only and must be confirmed with Adam Chellvan Properties and Investment before any transaction. Indicative currency conversions are estimates, not transaction quotes. Buyers should carry out independent legal and title due diligence.",
  footerNote:
    "Property details, prices and availability must be confirmed before any transaction. Indicative currency conversions are estimates only and do not constitute a quote.",
  currency: "NGN",
  seoTitle: "Adam Chellvan Properties and Investment | Property in Lagos & Nigeria",
  seoDescription:
    "Find houses, apartments, land and commercial property for sale, rent and lease in Lagos and across Nigeria. Property sourcing and investor support for Nigerians abroad.",
};

const CATEGORIES: [string, string][] = [
  ["House", "RESIDENTIAL"],
  ["Detached house", "RESIDENTIAL"],
  ["Semi-detached house", "RESIDENTIAL"],
  ["Terrace house", "RESIDENTIAL"],
  ["Duplex", "RESIDENTIAL"],
  ["Bungalow", "RESIDENTIAL"],
  ["Apartment", "RESIDENTIAL"],
  ["Penthouse", "RESIDENTIAL"],
  ["Office space", "COMMERCIAL"],
  ["Retail / shop", "COMMERCIAL"],
  ["Mixed-use building", "COMMERCIAL"],
  ["Warehouse", "INDUSTRIAL"],
  ["Land", "LAND"],
];

const AMENITIES = [
  "Swimming pool",
  "Gym",
  "24-hour security",
  "Gated estate",
  "CCTV",
  "Backup power / generator",
  "Solar power",
  "Borehole / water supply",
  "Fitted kitchen",
  "Air conditioning",
  "Boys' quarters",
  "Balcony",
  "Garden",
  "Parking",
  "Elevator",
  "Serviced",
  "Good road access",
  "Waterfront",
];

// ─── Services named in the client brief. Copy is drafted from the brief — review before launch. ───
const SERVICES: { title: string; summary: string; body: string; isPublished: boolean }[] = [
  {
    title: "Property Sales & Acquisition",
    summary: "Support finding and acquiring residential and commercial property in Nigeria, from first search to transaction.",
    isPublished: true,
    body: `Whether you are buying your first home, upgrading, or acquiring an asset for your business, we help you identify suitable options and move through the process with clarity.

## How we help
- Understanding your requirements: location, budget, property type and timeline
- Identifying relevant listings and sourcing options that match your brief
- Arranging inspections, including remote video inspections for clients abroad
- Communicating listing details clearly, including what still needs to be verified
- Supporting negotiation and coordinating documentation and due diligence with your legal adviser

## Selling a property?
If you own a property you would like to sell, you can submit it for review through our List Your Property page.`,
  },
  {
    title: "Rentals & Leasing",
    summary: "Residential and commercial properties to rent or lease, and support for landlords letting their properties.",
    isPublished: true,
    body: `We work with tenants looking for homes and business premises, and with landlords looking for suitable occupants.

## For tenants
- Residential rentals: apartments, houses and duplexes
- Commercial leases: offices, retail spaces and warehouses
- Inspections arranged at times that suit you

## For landlords
- Marketing your property to relevant prospective tenants
- Coordinating enquiries and inspections

Browse current rental and lease listings, or tell us what you need and we'll look for suitable options.`,
  },
  {
    title: "Land & Commercial Property",
    summary: "Land acquisition, development sites, offices, retail spaces, warehouses and business premises.",
    isPublished: true,
    body: `Land and commercial property decisions involve particular considerations — from title documents and access to zoning and suitability for your intended use.

## What we cover
- Land for residential or commercial development
- Offices, retail spaces and mixed-use buildings
- Warehouses and business premises

## Due diligence
We pay attention to documentation and coordinate due diligence steps with your appointed legal and survey professionals before you commit.`,
  },
  {
    title: "Investment Opportunities",
    summary: "Property sourcing and support evaluating real estate opportunities in Nigeria, for local and international investors.",
    isPublished: true,
    body: `We help investors explore property opportunities in Nigeria with a clearer understanding of the location, listing details, transaction process and the questions to address before committing.

## How we support investors
- Sourcing properties and land that match your objectives and budget
- Sharing the information you need to evaluate an opportunity
- Coordinating inspections, including remote inspections for investors abroad
- Supporting documentation and due diligence coordination

We do not guarantee returns or investment performance. Every opportunity should be independently assessed, and investors should take their own legal and financial advice.`,
  },
  {
    title: "Property Sourcing & Advisory",
    summary: "Can't find what you need? Share your requirements and we'll search for suitable options on your behalf.",
    isPublished: true,
    body: `Not every suitable property is advertised. If you can't find what you are looking for, tell us your preferred location, property type, budget and goals, and our team will review your requirements and respond with suitable options where available.

## What to share with us
- The type of property and how you intend to use it
- Preferred locations and any you would rule out
- Your budget range and timeline
- Must-have features (for example, security, parking or power supply)

## Who it's for
- Buyers and tenants with specific requirements
- Nigerians abroad who need someone on the ground
- Investors and developers seeking land or income-producing assets`,
  },
  {
    title: "Selling & Letting Your Property",
    summary: "For owners, landlords and developers: submit your property for review and marketing to relevant buyers and tenants.",
    isPublished: true,
    body: `If you are a property owner, landlord or developer, we can review your property and discuss how to present it to relevant buyers, tenants and investors.

## How it works
- Submit your property details, asking price and photographs through our List Your Property form
- Our team reviews the submission and contacts you to discuss next steps
- Nothing is published until the details have been reviewed and agreed with you

Please don't send title documents through the website — we'll arrange a secure way to review them.`,
  },
  {
    title: "Property Management",
    summary: "[WHERE APPLICABLE — confirm whether this service is offered before publishing.]",
    isPublished: false,
    body: `[Describe the property management services offered, if any. This page is unpublished until confirmed by the business.]`,
  },
];

// ─── Draft guides for the Insights section (unpublished — review, ideally with a lawyer, before publishing) ───
const ARTICLES: { title: string; excerpt: string; body: string }[] = [
  {
    title: "Buying Property in Nigeria from Abroad: A Practical Checklist",
    excerpt: "Key steps and questions for Nigerians in the diaspora and international buyers considering property in Nigeria.",
    body: `Buying property from abroad is very achievable with the right preparation. This checklist sets out the main steps and questions to work through before you commit.

## 1. Define your objective
Be clear whether the property is a family home, a future retirement base, a rental investment or land for development. Your objective shapes the location, property type and budget that make sense.

## 2. Choose your location carefully
Research access roads, flooding history, security, power and water supply, and how established the area or estate is. Where possible, ask for recent photos and a video walkthrough.

## 3. Insist on proper inspections
If you can't attend in person, ask for a live video inspection rather than pre-recorded footage, and consider asking a trusted representative to visit.

## 4. Verify the documents
Ask what title documents exist and have them checked independently by a lawyer you appoint. See our guide to property documentation for the common document types.

## 5. Understand the full cost
Beyond the purchase price, budget for legal fees, agency fees, survey costs, government charges for perfecting title, and any development or service levies in an estate.

## 6. Use traceable payments
Make payments to verified accounts against documented agreements, and keep records of every transaction.

## Questions to ask before committing
- Who is the legal owner, and can they sell?
- What title document does the property have, and has it been independently verified?
- Are there any disputes, encumbrances or government acquisitions affecting the land?
- What are all the costs, and who pays each one?
- How will inspections and the handover be arranged?

This guide is general information, not legal or financial advice. Always appoint your own lawyer before any transaction.`,
  },
  {
    title: "Understanding Property Documentation in Nigeria",
    excerpt: "An introduction to common property and land documents in Nigeria and why independent verification matters.",
    body: `Documentation is one of the most important parts of any property transaction in Nigeria. This guide introduces some of the documents you are likely to encounter. It is not exhaustive and is not legal advice.

## Certificate of Occupancy (C of O)
Issued by a state government, it evidences a right of occupancy over land under the Land Use Act.

## Governor's Consent
Where land that already has a C of O is transferred, the Governor's Consent is generally required to perfect the new owner's title.

## Deed of Assignment
The agreement that transfers an owner's interest in a property to a buyer. It is typically registered after the Governor's Consent is obtained.

## Survey plan
A document prepared by a registered surveyor showing the boundaries and location of a parcel of land. It can be checked to confirm the land is not affected by government acquisition.

## Excision and gazette
In some areas, land released from government acquisition to a community is recorded in an official gazette. Buyers should understand the status of the land they are buying.

## Why independent verification matters
Always instruct your own lawyer to conduct searches at the relevant land registry and to review every document before you make payment.

This article is general information only. Requirements vary by state, so seek legal advice for your specific transaction.`,
  },
  {
    title: "Questions to Ask Before Committing to a Property Investment",
    excerpt: "A simple framework for evaluating a property opportunity before you commit funds.",
    body: `Every property opportunity should be evaluated on its own merits. These questions can help you assess whether an opportunity fits your goals.

## The property
- Is the title clear and independently verified?
- What condition is the property in, and what will maintenance or completion cost?
- Is the location accessible, secure and in demand?

## The numbers
- What are the total acquisition costs, including fees and charges?
- If it is a rental investment, what rent can realistically be achieved, and what are the running costs?
- How would changes in exchange rates affect you if you earn in another currency?

## The exit
- How easily could you sell or let the property in future?
- What is your expected holding period?

## The people
- Who are you dealing with, and how have they been verified?
- Who will manage the property if you are not in Nigeria?

No one can guarantee investment returns. Take independent legal and financial advice before committing.`,
  },
];

async function main() {
  const existing = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (!existing) {
    await db.siteSettings.create({ data: { id: "site", ...SETTINGS } });
  } else if (existing.companyName.startsWith("[")) {
    // A placeholder row from an earlier seed: fill it with the approved copy.
    await db.siteSettings.update({ where: { id: "site" }, data: SETTINGS });
  }

  for (const [i, [name, group]] of CATEGORIES.entries()) {
    await db.propertyCategory.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name), group, sortOrder: i } });
  }
  for (const name of AMENITIES) {
    await db.amenity.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
  }
  for (const [i, s] of SERVICES.entries()) {
    await db.service.upsert({ where: { slug: slugify(s.title) }, update: {}, create: { ...s, slug: slugify(s.title), sortOrder: i } });
  }
  for (const a of ARTICLES) {
    await db.article.upsert({ where: { slug: slugify(a.title) }, update: {}, create: { ...a, slug: slugify(a.title), isPublished: false } });
  }

  console.log(
    `Seeded brand copy, ${CATEGORIES.length} categories, ${AMENITIES.length} amenities, ${SERVICES.length} services and ${ARTICLES.length} draft articles.`,
  );
  console.log("Next: npm run admin:create — then add contact details, locations (start with Lagos areas) and listings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
