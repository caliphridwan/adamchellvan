# Adam Chellvan Properties and Investment — Website & Property Platform

*Beyond Property. Towards Prosperity.*

The central digital platform for Adam Chellvan Properties and Investment. It covers property discovery, investor engagement and lead generation for clients in Nigeria and abroad. Built with **Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Zod**.

## What's included (Stage 1 of the brief)

| Brief requirement | Where it lives |
|---|---|
| Classic luxury navy / gold / white design, editorial typography | `tailwind.config.ts`, `src/app/globals.css`, logo lockup in `Logo.tsx` |
| Homepage copy (hero, services strip, categories, approach, diaspora section, sourcing CTA) | Seeded into **Admin › Content › Site settings**, all editable |
| Navigation: Find a Property · Rent & Lease · Investment · International Clients · Insights · About · Contact · List Your Property | `Header.tsx` |
| Pages: Home, About, Properties for Sale, Rent & Lease, Land & Commercial, Investment Opportunities, Property Sourcing & Advisory, Property Management (draft), List Your Property, International Clients, Insights/Blog, Contact, Privacy/Terms/Cookies | `src/app/(site)/…`, with services managed in **Content › Services** |
| Advanced search: buy / rent / lease / rent-or-lease / invest; category group and type; state + area; price range; beds/baths; land or property size; furnishing; amenities (parking, security…); status; date listed; sorting; pagination; shareable URLs | `src/lib/search.ts`, `FilterPanel.tsx` |
| Never implying unavailable property is available | Only published listings with a public status are shown. "Sold"/"Let" are labelled, "Unavailable" is hidden, and the dashboard flags live listings not re-confirmed in 30 days |
| Original-currency prices + indicative conversion, clearly marked as estimates | Rates set in **Site settings › Currency conversion** |
| Lead capture: property enquiry, inspection request (incl. remote video inspection), consultation, buyer/tenant requirements, international investor form, seller/landlord/developer submissions with photos | `LeadForms.tsx`, `EnquiryForm.tsx`, `ListingSubmissionForm.tsx` |
| Country-code phone fields, time-zone capture, remote consultation requests | `PhoneField`, investor form |
| WhatsApp + click-to-call on every major page | Header, footer, listings, landing pages |
| Email notifications for every new lead + customer confirmation | `src/app/actions/public.ts` (Resend) |
| Lead database / basic CRM: one inbox, status pipeline, assignment, follow-up dates, notes, CSV export, lead source | **Admin › Enquiries** |
| Conversion tracking: forms, phone, WhatsApp and email clicks | GA4 events (after consent) + anonymous first-party counts |
| Social-media → lead attribution | UTM / referrer captured per session and stored on each enquiry |
| Monthly reporting format | **Admin › Reports** |
| SEO: titles, descriptions, canonicals, sitemap, robots, breadcrumbs, structured data, Search Console verification, Lagos-focused area guides (no thin pages) | Throughout. Area guides: **Content › Taxonomy › (location)** |
| Educational content | 3 **draft** guides seeded in **Content › Articles** for review before publishing |

**Phase 2 items from the brief (not built yet):** saved searches with user accounts, interactive map search, CRM automation and email sequences, and a secure document room for serious prospects. Favourites already work without an account (stored on the visitor's device).

> **No business facts are invented.** The seed adds the approved copy from the brief. Contact details, office address, logo, photography, mission/vision, credentials, testimonials, locations and listings must be added by the business, and the dashboard shows a "Before launch" checklist until they are. Service-page text was drafted from the brief and should be reviewed. Legal pages are drafts for a lawyer to review.

---

## Placeholder photography

Until the business supplies its own photographs, pages use **free-licence photos of premium Lagos architecture** from Unsplash (Victoria Island, Lekki and Ikoyi). They appear in the homepage hero, category cards, section art, every page header, the 404 and sign-in pages, and as covers for articles without one. Each image carries a small credit to its photographer.

- **They're bundled with the site, not on Cloudinary.** `npm install` automatically downloads them into `public/images/lagos/` (or run `npm run images:fetch`). Commit that folder so your live site serves them itself. Until they're downloaded, the site loads them from Unsplash.
- The full list, with photographers and source links, is in `src/lib/placeholder-images.ts`. Change `PAGE_IMAGES` there to re-assign images.
- Setting a **Hero image URL** in Site settings replaces the homepage placeholder.
- They are used **only as area and skyline illustration, never as photos of a listed property**. Listings without photos show the branded "Photography coming soon" panel, so nobody mistakes a stock image for the actual property.
- Replace them with your own commissioned photography before or soon after launch for the strongest brand.

## 1. Quick start (local)

Requirements: Node.js 18.18+ (20 LTS recommended) and PostgreSQL 14+.

```bash
cp .env.example .env            # then edit DATABASE_URL, NEXT_PUBLIC_SITE_URL, SESSION_SECRET
npm install
npx prisma migrate dev --name init   # creates prisma/migrations — commit this folder
npm run db:seed                 # settings placeholders, categories, amenities
npm run admin:create            # prompts for email, name and password (hidden input)
npm run dev                     # http://localhost:3000  ·  admin: /admin/login
```

Then in the admin:

1. **Content › Site settings**: add the phone, WhatsApp number (digits, e.g. `2348012345678`), email, office address, business hours, logo URL, hero photograph, social links, mission and vision. Set the indicative exchange rates (e.g. `USD=1550`) and the date they were last updated.
2. **Content › Taxonomy**: add the areas you actively serve, starting with Lagos (e.g. *Lekki Phase 1*, city *Lagos*, state *Lagos*). Open an area to write its guide.
3. **Content › Services**: review the seeded service pages. *Property Management* stays unpublished until you confirm it is offered.
4. **Content › Articles**: review the three draft guides (ideally with your lawyer), then publish.
5. **Properties › Add property**: save, upload photos, set the status to *Available*, tick *Investment opportunity* where relevant, then **Publish**.

The dashboard shows a "Before launch" checklist until the key settings and integrations are complete.

## 2. Environment variables

See `.env.example` for the full list with comments.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public base URL for canonical links, sitemap and emails |
| `SESSION_SECRET` | ✅ | Long random string; salts hashed IPs used for rate limiting |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Optional | Without these, uploaded photos and brochures are stored in PostgreSQL and served from `/media/…`. Add Cloudinary as the photo library grows |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email | Staff alerts and customer confirmations |
| `NOTIFY_EMAIL` | Optional | Staff inbox(es) for new enquiries; falls back to the settings email |
| `LISTING_REF_PREFIX` | Optional | Listing reference prefix (`ACP-2026-0001`) |
| `NEXT_PUBLIC_GA_ID` | Recommended | Google Analytics 4 (loaded only after consent); tracks `generate_lead`, `whatsapp_click`, `phone_click`, `email_click` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Recommended | Google Search Console HTML-tag verification |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Cookie-free analytics alternative |

No secret is ever exposed to the browser. Only `NEXT_PUBLIC_*` variables reach client code, and those contain no credentials.

### Image storage — Cloudinary is optional
Out of the box, listing photos, floor plans, brochures and owner-submitted photos are stored **in your PostgreSQL database** and served by the site at `/media/<id>` with long-term caching. Nothing to set up.

This suits a launch-sized library (a few hundred photos). Database storage counts against your Render database plan, so for a large library switch to Cloudinary. New uploads then go there automatically, and existing photos keep working.

1. Create a Cloudinary account and copy the cloud name, API key and API secret from the dashboard.
2. Set the three `CLOUDINARY_*` variables. Uploads are signed server-side, validated by file signature (JPEG/PNG/WebP/PDF only), and limited to `MAX_UPLOAD_MB` each.
3. Images are served through `next/image` (AVIF/WebP, responsive sizes, lazy loading below the fold).

### Email (Resend)
1. Create a Resend account and verify your sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Company <hello@yourdomain.com>`).
3. Without these, enquiries are still saved and visible in the dashboard. Emails are skipped and a non-personal notice is logged.

### Google Search Console & Analytics
1. In Search Console, add your domain property and choose **HTML tag**. Copy the `content` value into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy, then submit `https://yourdomain/sitemap.xml`.
2. In GA4, create a web data stream and copy the Measurement ID (`G-…`) into `NEXT_PUBLIC_GA_ID`. Mark `generate_lead`, `whatsapp_click` and `phone_click` as key events.
3. Set up a Google Business Profile, if eligible, using the same name, address and phone shown on the site.

### Tracking social media leads
Add UTM tags to links you share, for example `https://yourdomain/rent-and-lease?utm_source=instagram&utm_medium=social&utm_campaign=lekki-rentals`. The first source a visitor arrives from is saved with their enquiry and shown in **Admin › Reports**. Without UTM tags, the referring site is used (e.g. `instagram.com / social`).

## 3. Deploying to Render

1. Push the repository (including `prisma/migrations`) to GitHub.
2. In Render: **New › Blueprint**, then select the repo. `render.yaml` creates the web service and a PostgreSQL database.
3. Fill in the `sync: false` variables (site URL, Cloudinary, Resend).
4. Each deploy runs `npm ci && npm run build`. Each start runs `prisma migrate deploy`, which applies pending migrations and never resets data.
5. Open the service **Shell** once and run:
   ```bash
   npm run db:seed
   npm run admin:create
   ```
6. Add your custom domain and update `NEXT_PUBLIC_SITE_URL`.

The build does not need database access: public pages render on request.

## 4. Architecture

```
prisma/schema.prisma        Data model (users, sessions, properties, media, taxonomy, enquiries, content, audit, rate limits)
prisma/seed.ts              Structural seed data only
scripts/create-admin.ts     Secure administrator creation / reset (no default password)
src/middleware.ts           Fast redirect for signed-out /admin visitors (convenience only)
src/lib/                    Server and pure logic
  auth.ts                   bcrypt (cost 12), DB-backed sessions, role gates
  permissions.ts            Role → permission matrix
  search.ts                 URL params → validated filters → Prisma query (public visibility guard)
  validation.ts             Zod schemas for every form
  queries.ts                Public read queries (never select private owner fields)
  upload.ts, file-type.ts   Signed Cloudinary uploads, magic-byte validation
  email.ts                  Resend REST client
  rate-limit.ts             DB-backed sliding-window limiter
  audit.ts, csv.ts, settings.ts, utils.ts
src/app/(site)/             Public website
src/app/admin/(auth)/       Sign-in
src/app/admin/(panel)/      Dashboard, properties, enquiries, content, users, audit log, account
src/app/admin/actions/      Server Actions (each re-checks session + permission)
src/components/             Site, admin and form components
tests/                      Vitest unit tests
```

### Roles
| Role | Can |
|---|---|
| **Administrator** | Everything, including site settings, users, deletion and the audit log |
| **Editor** | Create, edit and publish listings; manage content; see, assign and export all enquiries |
| **Agent** | View listings; see and update only the enquiries assigned to them |

### Key workflows
- **Listing lifecycle:** create (hidden draft) → add media → set status → **Publish**. Only published listings with a public status (*Available, Under offer, Reserved, Sold, Let*) ever reach public pages, search, the sitemap or structured data. By default, the public catalogue shows only listings still on the market. A published listing must be unpublished before it can be set to *Draft*, *Withdrawn* or *Archived*. Editors and administrators can archive. Only administrators can delete, with a confirmation step.
- **Private data:** private address, owner details and internal notes are stored on the listing but never selected by public queries. Maps appear only when *Show map* is ticked, and they use an approved public location.
- **Enquiries:** property enquiries, inspection requests, consultations, buyer/tenant requirements, investor enquiries, contact messages and owner submissions (with photos) all land in one inbox. Staff can update status, assign, link a property, set a follow-up date, add internal notes and export CSV. Every action is audited.
- **Saved properties:** stored in a first-party cookie on the visitor's device, so no account is needed. Customer accounts were deliberately not built: the brief says not to require registration without a genuine business reason.
- **Testimonials** can only be published once an admin confirms written client authorisation.

## 5. Security notes
- Passwords: bcrypt cost 12, minimum 12 characters with letters and numbers. Login uses constant-time comparison with generic errors and is rate-limited (8 attempts / 15 min per IP).
- Sessions: random 256-bit token in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie. Only its SHA-256 hash is stored. Sessions last 7 days and are revoked on password change, role change or deactivation.
- Authorisation is enforced server-side in every admin page, Server Action and route handler, not just in middleware.
- CSRF: Server Actions are POST-only with Next.js origin checking, and cookies are `SameSite=Lax`.
- Input: every form is validated with Zod on the server. Inputs are parameterised by Prisma, and the only raw query is a tagged template with bound values.
- XSS: admin text is rendered as React text nodes (never HTML), and JSON-LD escapes `<`.
- Public forms: honeypot field, DB-backed rate limits, consent checkbox.
- Uploads: signature-based type detection and size limits. SVG is rejected.
- CSV export neutralises spreadsheet formula injection.
- Security headers are set in `next.config.mjs`. `/admin` sends `noindex`.
- Logs never include passwords, tokens or enquiry contents. IPs are stored only as salted hashes in the rate-limit table.

This project has not been independently audited or certified, and no compliance claim is made.

## 6. Testing

```bash
npm test          # Vitest unit tests: search/filter builder, validation, permissions, CSV, file types, formatting
npm run typecheck # TypeScript
npm run lint
npm run build     # production build
```

**Manual pre-launch checklist:** sign in and out; create, edit, publish, unpublish, archive and delete a listing; upload, reorder and remove photos; search and filter on desktop and mobile, including reset; send an enquiry, a viewing request (check the dashboard and email) and a listing submission; sign in as an Agent and confirm you only see assigned enquiries; export CSV; check `/sitemap.xml` and `/robots.txt`; check keyboard-only navigation and visible focus states; run Lighthouse / axe on the home, listings and detail pages.

## 7. Backup & recovery
- **Render PostgreSQL** takes automatic daily backups on paid plans, with point-in-time recovery on higher tiers. Confirm which applies to your plan.
- Manual backup: `pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%F).dump`
- Restore into an empty database: `pg_restore --no-owner -d "$NEW_DATABASE_URL" backup.dump`, then point `DATABASE_URL` at it.
- Media lives in Cloudinary. Enable Cloudinary backups in its settings if required.
- Suggested retention: delete enquiries no longer needed (an admin can delete an enquiry, e.g. on a data-deletion request), and periodically clear `RateLimitHit` rows (this also happens automatically).

## 8. Monthly reporting
**Admin › Reports** shows, for any month compared with the previous one:
- Enquiries, qualified leads and closed deals
- WhatsApp, phone and email clicks
- Enquiries by type, lead source and landing page
- Most-enquired listings, new listings published and live listings

It also includes short guidance on using the figures. Visitor numbers and Google search queries come from GA4 and Search Console.

## 9. Known limitations / next steps
- Customer accounts, password reset by email for staff, and per-user saved searches are not implemented. Staff passwords are reset by an administrator or via `npm run admin:create`.
- Navigation menu items are fixed in code (footer service links update automatically).
- Article and service bodies use a small, safe text format (`## Heading`, `- list`) rather than a rich-text editor.
- Enquiry trend chart buckets by UTC day.
