import { prisma } from "./prisma";

// Fills gaps left by seed-data.ts (which skips a whole table once it has
// any rows, so it never reaches a fully-seeded state on its own) — this
// script upserts by slug instead, so it can be re-run safely and only adds
// what's actually missing. Same placeholder/demo tone as seed-data.ts.

async function seedCategories() {
  const categories = [
    { name: "Prescription Services", slug: "prescription-services", type: "service" },
    { name: "Wellness Services", slug: "wellness-services", type: "service" },
    { name: "Pain Relief", slug: "pain-relief", type: "product" },
    { name: "Vitamins & Supplements", slug: "vitamins-supplements", type: "product" },
    { name: "Personal Care", slug: "personal-care", type: "product" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`Ensured ${categories.length} categories.`);
}

async function seedServices() {
  const prescriptionCategory = await prisma.category.findUnique({ where: { slug: "prescription-services" } });
  const wellnessCategory = await prisma.category.findUnique({ where: { slug: "wellness-services" } });

  const services = [
    {
      name: "Prescription Refills",
      slug: "prescription-refills",
      shortDescription: "Fast, convenient refills for your ongoing medication.",
      keyBenefit: "No need to wait in line at the counter.",
      categoryId: prescriptionCategory?.id,
    },
    {
      name: "Medication Counseling",
      slug: "medication-counseling",
      shortDescription: "Professional guidance on how to use your medicines safely.",
      keyBenefit: "One-on-one time with a qualified pharmacist.",
      categoryId: prescriptionCategory?.id,
    },
    {
      name: "Health & Wellness",
      slug: "health-wellness",
      shortDescription: "General wellness support, preventive health information and screening.",
      keyBenefit: "Preventive care without an appointment.",
      categoryId: wellnessCategory?.id,
    },
    {
      name: "Vaccination Services",
      slug: "vaccination-services",
      shortDescription: "Approved vaccinations available at select branches.",
      keyBenefit: "Walk-in vaccination, no clinic visit required.",
      categoryId: wellnessCategory?.id,
    },
    {
      name: "Health Screening",
      slug: "health-screening",
      shortDescription: "Blood pressure, blood sugar and basic health checks at the counter.",
      keyBenefit: "Know your numbers without booking a clinic visit.",
      categoryId: wellnessCategory?.id,
    },
    {
      name: "Home Delivery",
      slug: "home-delivery",
      shortDescription: "Prescription and product delivery for customers who can't get to a branch.",
      keyBenefit: "Get your medication without leaving home.",
      categoryId: prescriptionCategory?.id,
    },
    {
      name: "Travel Health Advice",
      slug: "travel-health-advice",
      shortDescription: "Guidance on medication, vaccination and health precautions before you travel.",
      keyBenefit: "Practical advice tailored to your destination.",
      categoryId: wellnessCategory?.id,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: { categoryId: service.categoryId },
      create: service,
    });
  }
  console.log(`Ensured ${services.length} services.`);
}

async function seedProducts() {
  const painRelief = await prisma.category.findUnique({ where: { slug: "pain-relief" } });
  const vitamins = await prisma.category.findUnique({ where: { slug: "vitamins-supplements" } });
  const personalCare = await prisma.category.findUnique({ where: { slug: "personal-care" } });

  const products = [
    {
      name: "Paracetamol 500mg",
      slug: "paracetamol-500mg",
      brandName: "Panadol",
      categoryId: painRelief?.id,
      generalUse: "Relief of mild to moderate pain and fever.",
      activeIngredient: "Paracetamol",
      formStrength: "500mg tablet",
      manufacturer: "GSK",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Vitamin C 1000mg",
      slug: "vitamin-c-1000mg",
      categoryId: vitamins?.id,
      generalUse: "Immune system support.",
      activeIngredient: "Ascorbic acid",
      formStrength: "1000mg tablet",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Hand Sanitizer Gel",
      slug: "hand-sanitizer-gel",
      categoryId: personalCare?.id,
      generalUse: "Kills common germs without water.",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Amoxicillin 500mg",
      slug: "amoxicillin-500mg",
      generalUse: "Antibiotic for bacterial infections.",
      activeIngredient: "Amoxicillin",
      formStrength: "500mg capsule",
      requiresPrescription: true,
      availabilityStatus: "unknown",
    },
    {
      name: "Ibuprofen 400mg",
      slug: "ibuprofen-400mg",
      brandName: "Brufen",
      categoryId: painRelief?.id,
      generalUse: "Relief of pain, inflammation and fever.",
      activeIngredient: "Ibuprofen",
      formStrength: "400mg tablet",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Multivitamin Tablets",
      slug: "multivitamin-tablets",
      categoryId: vitamins?.id,
      generalUse: "Daily multivitamin and mineral support.",
      formStrength: "30 tablets",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Omega-3 Fish Oil",
      slug: "omega-3-fish-oil",
      categoryId: vitamins?.id,
      generalUse: "Supports heart and brain health.",
      activeIngredient: "Fish oil (EPA/DHA)",
      formStrength: "1000mg softgel",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Antiseptic Wipes",
      slug: "antiseptic-wipes",
      categoryId: personalCare?.id,
      generalUse: "Cleans minor cuts and grazes before dressing.",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Sunscreen SPF50",
      slug: "sunscreen-spf50",
      categoryId: personalCare?.id,
      generalUse: "Broad-spectrum protection against UVA/UVB rays.",
      formStrength: "100ml",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Oral Rehydration Salts",
      slug: "oral-rehydration-salts",
      generalUse: "Replaces fluids and salts lost to dehydration.",
      formStrength: "Sachet, makes 200ml",
      requiresPrescription: false,
      availabilityStatus: "in_stock",
    },
    {
      name: "Cough Syrup 100ml",
      slug: "cough-syrup-100ml",
      generalUse: "Relief of dry and chesty cough.",
      formStrength: "100ml bottle",
      requiresPrescription: false,
      availabilityStatus: "unknown",
    },
  ];

  for (const product of products) {
    const { slug, ...data } = product;
    await prisma.product.upsert({
      where: { slug },
      update: { categoryId: data.categoryId },
      create: { slug, ...data },
    });
  }
  console.log(`Ensured ${products.length} products.`);
}

async function seedLocations() {
  const existing = await prisma.pharmacyLocation.findMany({ select: { branchName: true } });
  const existingNames = new Set(existing.map((location) => location.branchName));

  const locations = [
    {
      slug: "ingata-pharmacy-remera-branch",
      branchName: "Ingata Pharmacy - Remera Branch",
      address: "KG 11 Ave, Remera, Kigali, Rwanda",
      telephone: "+250788123457",
      latitude: -1.9578,
      longitude: 30.1127,
      openingHours: {
        monday: "8:00-20:00",
        tuesday: "8:00-20:00",
        wednesday: "8:00-20:00",
        thursday: "8:00-20:00",
        friday: "8:00-20:00",
        saturday: "9:00-18:00",
        sunday: "10:00-14:00",
      },
      availableServices: ["prescription-refills", "medication-counseling", "health-screening"],
    },
    {
      slug: "ingata-pharmacy-kimironko-branch",
      branchName: "Ingata Pharmacy - Kimironko Branch",
      address: "KG 7 Ave, Kimironko, Kigali, Rwanda",
      telephone: "+250788123458",
      latitude: -1.9395,
      longitude: 30.1234,
      openingHours: {
        monday: "8:00-19:00",
        tuesday: "8:00-19:00",
        wednesday: "8:00-19:00",
        thursday: "8:00-19:00",
        friday: "8:00-19:00",
        saturday: "9:00-17:00",
        sunday: "closed",
      },
      availableServices: ["prescription-refills", "vaccination-services", "home-delivery"],
    },
    {
      slug: "ingata-pharmacy-nyamirambo-branch",
      branchName: "Ingata Pharmacy - Nyamirambo Branch",
      address: "KN 88 St, Nyamirambo, Kigali, Rwanda",
      telephone: "+250788123459",
      latitude: -1.9706,
      longitude: 30.0388,
      openingHours: {
        monday: "8:00-20:00",
        tuesday: "8:00-20:00",
        wednesday: "8:00-20:00",
        thursday: "8:00-20:00",
        friday: "8:00-20:00",
        saturday: "9:00-18:00",
        sunday: "10:00-14:00",
      },
      availableServices: ["prescription-refills", "medication-counseling", "health-wellness"],
    },
  ];

  let created = 0;
  for (const location of locations) {
    if (existingNames.has(location.branchName)) continue;
    await prisma.pharmacyLocation.create({ data: location });
    created += 1;
  }
  console.log(`Added ${created} new pharmacy locations (${locations.length - created} already existed).`);
}

async function seedArticles() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.log("No admin user found. Run `npm run seed:admin` first. Skipping articles.");
    return;
  }

  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

  const articles = [
    {
      title: "Understanding Your Prescription Label",
      slug: "understanding-your-prescription-label",
      content:
        "Every prescription label carries more information than just the medicine name. Dosage instructions, frequency, and warnings about food or alcohol interactions are all there for a reason. If any part of your label is unclear, ask the pharmacist on duty before you leave the counter — it only takes a minute and can prevent a dosing mistake.",
      category: "Medication Safety",
      tags: ["prescriptions", "medication-safety"],
      publishedAt: daysAgo(3),
    },
    {
      title: "When to See a Pharmacist vs a Doctor",
      slug: "pharmacist-vs-doctor",
      content:
        "Pharmacists are trained to advise on minor ailments, medication interactions and over-the-counter treatment options — often without an appointment. For persistent symptoms, new diagnoses or anything that doesn't improve within a few days, a doctor's visit is still the right call. When in doubt, ask at the counter; we'll tell you honestly if you need to see a physician.",
      category: "Health Tips",
      tags: ["pharmacist-advice"],
      publishedAt: daysAgo(7),
    },
    {
      title: "Staying Hydrated: Why Oral Rehydration Salts Matter",
      slug: "staying-hydrated-oral-rehydration-salts",
      content:
        "Diarrhea, vomiting and hot weather can all lead to dehydration faster than plain water alone can fix. Oral rehydration salts replace the sodium, potassium and glucose your body loses, helping you recover faster. Keep a sachet at home, especially if you have young children or elderly family members.",
      category: "Health Tips",
      tags: ["hydration", "family-health"],
      publishedAt: daysAgo(10),
    },
    {
      title: "Traveling Soon? A Pharmacist's Checklist",
      slug: "traveling-soon-pharmacist-checklist",
      content:
        "Before a trip, check that you have enough of your regular medication to last the full journey plus a few extra days, carry prescriptions in their original packaging, and ask about any vaccinations recommended for your destination. Our pharmacists can put together a simple travel health checklist tailored to where you're headed.",
      category: "Health Tips",
      tags: ["travel", "pharmacist-advice"],
      publishedAt: daysAgo(14),
    },
  ];

  let created = 0;
  for (const article of articles) {
    const exists = await prisma.article.findUnique({ where: { slug: article.slug } });
    if (exists) continue;
    await prisma.article.create({
      data: {
        ...article,
        authorId: admin.id,
        status: "published",
        metaTitle: `${article.title} | Ingata Pharmacy`,
      },
    });
    created += 1;
  }
  console.log(`Added ${created} new articles (${articles.length - created} already existed).`);
}

async function seedMoreData() {
  await seedCategories();
  await seedServices();
  await seedProducts();
  await seedLocations();
  await seedArticles();

  await prisma.$disconnect();
}

seedMoreData().catch((error) => {
  console.error("Failed to seed additional data:", error);
  process.exit(1);
});
