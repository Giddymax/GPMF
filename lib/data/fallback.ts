/**
 * Static content mirroring supabase/seed.sql, used whenever no Supabase
 * project is connected yet (NEXT_PUBLIC_SUPABASE_URL unset) so the public
 * site renders fully in local dev before the database exists.
 */
import type { Faq, Post, Rate, SiteStat, TeamMember, Testimonial } from "@/lib/supabase/types";

export const fallbackPosts: Post[] = [
  {
    id: "1",
    slug: "community-durbar-launch",
    title: "Grainy Palace opens its doors with a community durbar",
    excerpt:
      "Chiefs, market queens and hundreds of traders welcomed Grainy Palace Financial Service to town.",
    body: "Grainy Palace Financial Service opened its Nsawam office with a community durbar attended by the local chief, assembly member, market queen and church and mosque leaders. Trust is the product we are selling, and there is no better way to earn it than showing up in the community that will hold our passbooks.",
    cover_image_url: null,
    author: "Grainy Palace Comms",
    published: true,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "susu-101",
    title: "Susu 101: how your daily contribution becomes a lump sum",
    excerpt: "A plain-English walkthrough of the 31-day susu cycle, from first contribution to payout.",
    body: "Every day, one of our mobile bankers visits your stall or shop and collects whatever amount you have chosen to save. After 31 days, you get the full amount back, minus one day's contribution as our collection fee. No paperwork, no queues — just discipline, one cedi at a time.",
    cover_image_url: null,
    author: "Grainy Palace Comms",
    published: true,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    slug: "first-loan-milestone",
    title: "50 micro-loans disbursed to market traders",
    excerpt: "Our susu clients are now graduating into working-capital loans for their stalls.",
    body: "Fifty of our longest-standing susu and savings clients have now received micro-loans to restock their stalls ahead of the festive season — proof that a clean savings record really is a credit score in this town.",
    cover_image_url: null,
    author: "Grainy Palace Comms",
    published: true,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const fallbackTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Ama Owusu",
    town: "Nsawam",
    quote:
      "My susu collector comes to my stall every morning, rain or shine. I have never had to close my shop to go to a bank.",
    photo_url: null,
    product: "daily-susu",
    published: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Kwame Boateng",
    town: "Suhum",
    quote:
      "I saved for eight months before I asked for a loan. They approved it in two days because my savings record spoke for me.",
    photo_url: null,
    product: "loans",
    published: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Efua Mensah",
    town: "Koforidua",
    quote:
      "The fixed deposit rate is better than anything my old bank offered, and the manager still remembers my name.",
    photo_url: null,
    product: "fixed-deposit",
    published: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Kofi Asante",
    town: "Nkawkaw",
    quote: "When I lost my passbook, they sorted it out the same day with my Ghana Card. No wahala.",
    photo_url: null,
    product: "savings",
    published: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
];

export const fallbackFaqs: Faq[] = [
  {
    id: "1",
    question: "Is my money safe with Grainy Palace?",
    answer:
      "Yes. Every cedi you save is recorded in our double-entry ledger the moment our agent collects it, you get an instant receipt, and we keep a minimum 30% liquidity reserve at all times so withdrawals are never a problem.",
    category: "safety",
    sort_order: 1,
    published: true,
  },
  {
    id: "2",
    question: "How do I know my mobile banker is genuine?",
    answer:
      "Every agent carries a photo ID card and issues a printed or SMS receipt for every single collection. If a collector cannot produce both, do not hand over your money — call our office immediately.",
    category: "safety",
    sort_order: 2,
    published: true,
  },
  {
    id: "3",
    question: "Can I withdraw my savings at any time?",
    answer:
      "Yes, savings accounts allow withdrawals at any time (a small fee applies). Susu contributions are designed to be held for the full 31-day cycle, and fixed deposits carry an early-termination adjustment if broken before maturity.",
    category: "withdrawals",
    sort_order: 3,
    published: true,
  },
  {
    id: "4",
    question: "What interest rates do you offer?",
    answer:
      "Savings pay around 5% per year, fixed deposits pay 10-14% per year depending on the term, and susu charges one day's contribution per month as a collection fee. Exact current rates are always posted in our banking hall and on our Products pages.",
    category: "rates",
    sort_order: 4,
    published: true,
  },
  {
    id: "5",
    question: "I lost my passbook — what do I do?",
    answer:
      "Visit any branch with your Ghana Card. We will verify your identity against your client record and issue a replacement the same day.",
    category: "safety",
    sort_order: 5,
    published: true,
  },
  {
    id: "6",
    question: "How do I qualify for a loan?",
    answer:
      "Your own savings or susu record is your credit score: after 2 completed susu cycles or 3 months of savings history, you can borrow up to twice your average monthly savings inflow.",
    category: "loans",
    sort_order: 6,
    published: true,
  },
];

export const fallbackRates: Rate[] = [
  { id: "1", product: "savings", label: "Savings account", rate: 0.05, unit: "pa", min_amount: null, max_amount: null, term_months: null, sort_order: 1, active: true },
  { id: "2", product: "daily-susu", label: "Susu collection fee", rate: 0.032, unit: "monthly_of_collections", min_amount: null, max_amount: null, term_months: null, sort_order: 2, active: true },
  { id: "3", product: "fixed-deposit", label: "3-month fixed deposit", rate: 0.10, unit: "pa", min_amount: null, max_amount: null, term_months: 3, sort_order: 3, active: true },
  { id: "4", product: "fixed-deposit", label: "6-month fixed deposit", rate: 0.12, unit: "pa", min_amount: null, max_amount: null, term_months: 6, sort_order: 4, active: true },
  { id: "5", product: "fixed-deposit", label: "12-month fixed deposit", rate: 0.14, unit: "pa", min_amount: null, max_amount: null, term_months: 12, sort_order: 5, active: true },
  { id: "6", product: "loans", label: "Micro-loan interest", rate: 0.045, unit: "flat_monthly", min_amount: null, max_amount: null, term_months: null, sort_order: 6, active: true },
  { id: "7", product: "loans", label: "Loan processing fee", rate: 0.02, unit: "pct_of_principal", min_amount: null, max_amount: null, term_months: null, sort_order: 7, active: true },
];

export const fallbackSiteStats: SiteStat[] = [
  { id: "1", label: "Active clients", value: 30, suffix: "+", sort_order: 1 },
  { id: "2", label: "Field agents", value: 3, suffix: "", sort_order: 2 },
  { id: "3", label: "GHS mobilised", value: 45000, suffix: "+", sort_order: 3 },
  { id: "4", label: "Years serving the community", value: 1, suffix: "", sort_order: 4 },
];

export const fallbackTeamMembers: TeamMember[] = [
  { id: "1", full_name: "Abena Nyarko", role_title: "Chief Executive Officer", bio: "Founding CEO with a background in rural banking and a mission to bring safe, convenient savings to underserved market towns.", photo_url: null, sort_order: 1, published: true },
  { id: "2", full_name: "Kwesi Amankwah", role_title: "Head of Credit", bio: "Leads credit policy and loan appraisal, with a career built on disciplined, community-based lending.", photo_url: null, sort_order: 2, published: true },
  { id: "3", full_name: "Efua Owusu-Sarpong", role_title: "Head of Operations", bio: "Oversees the branch, cash controls and the field agent network that makes daily susu collection possible.", photo_url: null, sort_order: 3, published: true },
  { id: "4", full_name: "Kojo Antwi-Boasiako", role_title: "Compliance & Risk Officer", bio: "Keeps Grainy Palace aligned with Bank of Ghana guidelines and AML/CFT best practice.", photo_url: null, sort_order: 4, published: true },
];
