export const SiteConfig = {
  // Dati del Brand
  brandName: "WaForge",
  tagline: "L'Automazione WhatsApp definitiva per agenzie",
  description: "La piattaforma CRM completa per scalare l'assistenza e le vendite tramite WhatsApp.",
  
  // Dati Aziendali (Placeholder per il proprietario)
  companyName: "[Tua Azienda SRL]",
  vatNumber: "[IT0123456789]",
  address: "[Via Roma 1, 00100 Milano (MI)]",
  contactEmail: "support@tua-azienda.com",
  salesEmail: "sales@tua-azienda.com",

  // Link esterni
  dashboardUrl: import.meta.env.PUBLIC_DASHBOARD_URL || 'http://localhost:3000',
  socials: {
    twitter: "#",
    github: "#",
    linkedin: "#"
  }
};
