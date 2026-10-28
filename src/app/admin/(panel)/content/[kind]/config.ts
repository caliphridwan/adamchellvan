import { saveArticle, saveFaq, saveService, saveTestimonial } from "@/app/admin/actions/content";
import type { FormValues, SectionDef } from "@/components/admin/EntityForm";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

// Config-driven CRUD for simple content types: one list route and one edit route serve all of them.

export type Row = { id: string; title: string; meta: string; published: boolean; href?: string };

type KindConfig = {
  title: string;
  singular: string;
  intro: string;
  deleteKind: "service" | "faq" | "testimonial" | "article";
  sections: SectionDef[];
  list: () => Promise<Row[]>;
  load: (id: string) => Promise<FormValues | null>;
  action: typeof saveService;
  defaults: FormValues;
};

const seo: SectionDef = {
  title: "Search engines",
  fields: [
    { type: "text", name: "slug", label: "URL slug", hint: "Leave blank to generate from the title." },
    { type: "text", name: "seoTitle", label: "SEO title", span: 1 },
    { type: "textarea", name: "seoDescription", label: "SEO description", rows: 2 },
  ],
};

export const CONTENT_KINDS: Record<string, KindConfig> = {
  services: {
    title: "Services",
    singular: "service",
    intro: "Only list services the company actually offers.",
    deleteKind: "service",
    action: saveService,
    defaults: { isPublished: false, sortOrder: 0 },
    sections: [
      {
        title: "Service",
        fields: [
          { type: "text", name: "title", label: "Title", required: true },
          { type: "textarea", name: "summary", label: "Summary", required: true, rows: 2, hint: "Shown on the services list (max 320 characters)." },
          { type: "textarea", name: "body", label: "Page content", required: true, rows: 14, hint: "Use “## Heading” for headings and “- item” for lists. Separate paragraphs with a blank line." },
          { type: "number", name: "sortOrder", label: "Display order", span: 1 },
          { type: "checkbox", name: "isPublished", label: "Published", span: 1 },
        ],
      },
      seo,
    ],
    list: async () =>
      (await db.service.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] })).map((s) => ({
        id: s.id,
        title: s.title,
        meta: `/services/${s.slug} · order ${s.sortOrder}`,
        published: s.isPublished,
        href: s.isPublished ? `/services/${s.slug}` : undefined,
      })),
    load: async (id) => {
      const s = await db.service.findUnique({ where: { id } });
      return s ? { ...s, createdAt: undefined, updatedAt: undefined } : null;
    },
  },
  faqs: {
    title: "FAQs",
    singular: "FAQ",
    intro: "Questions and answers shown on the FAQ page.",
    deleteKind: "faq",
    action: saveFaq,
    defaults: { isPublished: true, sortOrder: 0 },
    sections: [
      {
        fields: [
          { type: "text", name: "question", label: "Question", required: true },
          { type: "textarea", name: "answer", label: "Answer", required: true, rows: 6 },
          { type: "number", name: "sortOrder", label: "Display order", span: 1 },
          { type: "checkbox", name: "isPublished", label: "Published", span: 1 },
        ],
      },
    ],
    list: async () =>
      (await db.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map((f) => ({
        id: f.id,
        title: f.question,
        meta: `order ${f.sortOrder}`,
        published: f.isPublished,
      })),
    load: async (id) => {
      const f = await db.faq.findUnique({ where: { id } });
      return f ? { ...f, createdAt: undefined, updatedAt: undefined } : null;
    },
  },
  testimonials: {
    title: "Testimonials",
    singular: "testimonial",
    intro: "Only genuine testimonials that the client has authorised for publication.",
    deleteKind: "testimonial",
    action: saveTestimonial,
    defaults: { isAuthorised: false, isPublished: false, sortOrder: 0 },
    sections: [
      {
        fields: [
          { type: "text", name: "authorName", label: "Client name", required: true, span: 1, hint: "As the client agreed to be named." },
          { type: "text", name: "authorRole", label: "Description", span: 1, placeholder: "e.g. Homebuyer, Lekki" },
          { type: "textarea", name: "quote", label: "Testimonial", required: true, rows: 5, hint: "Exact words supplied by the client." },
          { type: "checkbox", name: "isAuthorised", label: "The client has given written permission to publish this", span: 2 },
          { type: "checkbox", name: "isPublished", label: "Published", span: 1 },
          { type: "number", name: "sortOrder", label: "Display order", span: 1 },
        ],
      },
    ],
    list: async () =>
      (await db.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })).map((t) => ({
        id: t.id,
        title: t.authorName,
        meta: t.isAuthorised ? "Authorised" : "Not yet authorised",
        published: t.isPublished,
      })),
    load: async (id) => {
      const t = await db.testimonial.findUnique({ where: { id } });
      return t ? { ...t, createdAt: undefined, updatedAt: undefined } : null;
    },
  },
  articles: {
    title: "Articles & insights",
    singular: "article",
    intro: "News, market insights and guides.",
    deleteKind: "article",
    action: saveArticle,
    defaults: { isPublished: false },
    sections: [
      {
        title: "Article",
        fields: [
          { type: "text", name: "title", label: "Title", required: true },
          { type: "textarea", name: "excerpt", label: "Excerpt", required: true, rows: 2, hint: "Shown on listing pages (max 400 characters)." },
          { type: "textarea", name: "body", label: "Body", required: true, rows: 18, hint: "Use “## Heading”, “### Subheading” and “- item”. Separate paragraphs with a blank line." },
          { type: "url", name: "coverImageUrl", label: "Cover image URL", span: 1 },
          { type: "text", name: "coverImageAlt", label: "Cover image description", span: 1 },
          { type: "checkbox", name: "isPublished", label: "Published", span: 2 },
        ],
      },
      seo,
    ],
    list: async () =>
      (await db.article.findMany({ orderBy: { updatedAt: "desc" }, include: { author: { select: { name: true } } } })).map((a) => ({
        id: a.id,
        title: a.title,
        meta: `${a.publishedAt ? `Published ${formatDate(a.publishedAt)}` : "Not published"}${a.author ? ` · ${a.author.name}` : ""}`,
        published: a.isPublished,
        href: a.isPublished ? `/insights/${a.slug}` : undefined,
      })),
    load: async (id) => {
      const a = await db.article.findUnique({ where: { id } });
      return a ? { ...a, publishedAt: undefined, createdAt: undefined, updatedAt: undefined, authorId: undefined } : null;
    },
  },
};
