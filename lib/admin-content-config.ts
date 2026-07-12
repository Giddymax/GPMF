export type ContentTable = "posts" | "testimonials" | "faqs" | "rates" | "site_stats" | "team_members" | "hero_slides";

export const CONTENT_TABLES: ContentTable[] = [
  "hero_slides",
  "posts",
  "testimonials",
  "faqs",
  "rates",
  "site_stats",
  "team_members",
];

export type FieldType = "text" | "textarea" | "number" | "boolean" | "image";

export interface ContentField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

export const CONTENT_FIELDS: Record<ContentTable, ContentField[]> = {
  hero_slides: [
    { key: "image_url", label: "Slide image", type: "image" },
    { key: "eyebrow", label: "Eyebrow text", type: "text" },
    { key: "headline", label: "Headline", type: "text", required: true },
    { key: "subheading", label: "Subheading", type: "textarea" },
    { key: "primary_cta_label", label: "Primary button label", type: "text" },
    { key: "primary_cta_href", label: "Primary button link", type: "text" },
    { key: "secondary_cta_label", label: "Secondary button label", type: "text" },
    { key: "secondary_cta_href", label: "Secondary button link", type: "text" },
    { key: "sort_order", label: "Sort order", type: "number" },
    { key: "published", label: "Published", type: "boolean" },
  ],
  posts: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "slug", label: "Slug", type: "text", required: true },
    { key: "excerpt", label: "Excerpt", type: "textarea" },
    { key: "body", label: "Body", type: "textarea", required: true },
    { key: "author", label: "Author", type: "text" },
    { key: "cover_image_url", label: "Cover image URL", type: "text" },
    { key: "published", label: "Published", type: "boolean" },
  ],
  testimonials: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "town", label: "Town", type: "text" },
    { key: "quote", label: "Quote", type: "textarea", required: true },
    { key: "product", label: "Product", type: "text" },
    { key: "sort_order", label: "Sort order", type: "number" },
    { key: "published", label: "Published", type: "boolean" },
  ],
  faqs: [
    { key: "question", label: "Question", type: "text", required: true },
    { key: "answer", label: "Answer", type: "textarea", required: true },
    { key: "category", label: "Category", type: "text" },
    { key: "sort_order", label: "Sort order", type: "number" },
    { key: "published", label: "Published", type: "boolean" },
  ],
  rates: [
    { key: "product", label: "Product", type: "text", required: true },
    { key: "label", label: "Label", type: "text", required: true },
    { key: "rate", label: "Rate (decimal, e.g. 0.05)", type: "number", required: true },
    { key: "unit", label: "Unit", type: "text", required: true },
    { key: "term_months", label: "Term (months)", type: "number" },
    { key: "sort_order", label: "Sort order", type: "number" },
    { key: "active", label: "Active", type: "boolean" },
  ],
  site_stats: [
    { key: "label", label: "Label", type: "text", required: true },
    { key: "value", label: "Value", type: "number", required: true },
    { key: "suffix", label: "Suffix", type: "text" },
    { key: "sort_order", label: "Sort order", type: "number" },
  ],
  team_members: [
    { key: "full_name", label: "Full name", type: "text", required: true },
    { key: "role_title", label: "Role", type: "text", required: true },
    { key: "bio", label: "Bio", type: "textarea" },
    { key: "photo_url", label: "Photo URL", type: "text" },
    { key: "sort_order", label: "Sort order", type: "number" },
    { key: "published", label: "Published", type: "boolean" },
  ],
};

export const CONTENT_LABELS: Record<ContentTable, { title: string; primaryField: string }> = {
  hero_slides: { title: "Hero slides", primaryField: "headline" },
  posts: { title: "News", primaryField: "title" },
  testimonials: { title: "Testimonials", primaryField: "name" },
  faqs: { title: "FAQs", primaryField: "question" },
  rates: { title: "Rates", primaryField: "label" },
  site_stats: { title: "Site stats", primaryField: "label" },
  team_members: { title: "Team members", primaryField: "full_name" },
};
