export const defaultCrops = [
  { nameMr: "सोयाबीन", nameEn: "Soybean" },
  { nameMr: "तूर", nameEn: "Tur" },
  { nameMr: "हरभरा", nameEn: "Chana" },
  { nameMr: "कापूस", nameEn: "Cotton" },
  { nameMr: "गहू", nameEn: "Wheat" },
  { nameMr: "ज्वारी", nameEn: "Jowar" },
  { nameMr: "मका", nameEn: "Maize" },
  { nameMr: "मूग", nameEn: "Moong" },
  { nameMr: "उडीद", nameEn: "Udid" },
  { nameMr: "बाजरी", nameEn: "Bajra" },
].map((crop) => ({ ...crop, unit: "क्विंटल", isActive: true }));
