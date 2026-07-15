export const SiteConfig = {
  // Dati del Brand
  brandName: import.meta.env.PUBLIC_COMPANY_NAME || "WaForge",
  tagline: "L'Automazione WhatsApp definitiva per agenzie",
  description: "La piattaforma CRM completa per scalare l'assistenza e le vendite tramite WhatsApp.",
  
  // Dati Aziendali (Caricati da .env)
  companyName: import.meta.env.PUBLIC_COMPANY_NAME || "[Tua Azienda SRL]",
  vatNumber: import.meta.env.PUBLIC_COMPANY_VAT || "[IT0123456789]",
  fiscalCode: import.meta.env.PUBLIC_COMPANY_FISCAL_CODE || "",
  address: import.meta.env.PUBLIC_COMPANY_ADDRESS || "[Via Roma 1, 00100 Milano (MI)]",
  contactEmail: import.meta.env.PUBLIC_SUPPORT_EMAIL || "support@tua-azienda.com",
  salesEmail: import.meta.env.PUBLIC_SALES_EMAIL || "sales@tua-azienda.com",
  phone: import.meta.env.PUBLIC_COMPANY_PHONE || "",
  
  // Dati Societari EU / Note Fiscali aggiuntive
  capital: import.meta.env.PUBLIC_COMPANY_CAPITAL || "",
  rea: import.meta.env.PUBLIC_COMPANY_REA || "",
  legalNotes: import.meta.env.PUBLIC_COMPANY_LEGAL_NOTES || "",

  // Link esterni
  dashboardUrl: import.meta.env.PUBLIC_DASHBOARD_URL || 'http://localhost:3000',
  socials: {
    twitter: import.meta.env.PUBLIC_SOCIAL_TWITTER || "#",
    github: import.meta.env.PUBLIC_SOCIAL_GITHUB || "#",
    linkedin: import.meta.env.PUBLIC_SOCIAL_LINKEDIN || "#"
  }
};
