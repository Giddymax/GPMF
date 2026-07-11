export const siteConfig = {
  name: "Grainy Palace Financial Service",
  shortName: "Grainy Palace",
  tagline: "Save a little every day. Build something big.",
  phoneDisplay: "024 400 0000",
  phoneHref: "tel:+233244000000",
  whatsappHref: "https://wa.me/233244000000",
  email: "hello@grainypalacefinancial.com",
  complaintsEmail: "complaints@grainypalacefinancial.com",
  address: "Grainy Palace Financial Service, Main Market Road, Nsawam, Eastern Region, Ghana",
  hours: [
    { days: "Monday – Friday", time: "8:00am – 5:00pm" },
    { days: "Saturday", time: "9:00am – 1:00pm" },
    { days: "Sunday", time: "Closed (field agents available on request)" },
  ],
  socials: {
    facebook: "https://facebook.com/grainypalacefinancial",
    instagram: "https://instagram.com/grainypalacefinancial",
    x: "https://x.com/grainypalacefs",
  },
  regulatoryNote:
    "Grainy Palace Financial Service operates as a Last-Mile Provider under Bank of Ghana guidelines, offering susu collection, micro-savings mobilisation and micro-credit.",
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How Susu Works", href: "/#how-susu-works" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
] as const;

export const productLinks = [
  { label: "Savings", href: "/products/savings", blurb: "Everyday saving with modest interest" },
  { label: "Daily Susu", href: "/products/daily-susu", blurb: "A collector visits you, every day" },
  { label: "Fixed Deposit", href: "/products/fixed-deposit", blurb: "Lock in a lump sum, earn more" },
  { label: "Micro-Loans", href: "/products/loans", blurb: "Your savings record is your credit score" },
] as const;
