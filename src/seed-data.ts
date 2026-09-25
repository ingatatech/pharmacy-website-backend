import { prisma } from "./prisma";

async function seedCategories() {
  if ((await prisma.category.count()) > 0) {
    console.log("Categories already exist. Skipping.");
    return;
  }

  await prisma.category.createMany({
    data: [
      { name: "Prescription Services", slug: "prescription-services", type: "service" },
      { name: "Wellness Services", slug: "wellness-services", type: "service" },
      { name: "Pain Relief", slug: "pain-relief", type: "product" },
      { name: "Vitamins & Supplements", slug: "vitamins-supplements", type: "product" },
      { name: "Personal Care", slug: "personal-care", type: "product" },
    ],
  });
  console.log("Seeded categories.");
}

async function seedServices() {
  if ((await prisma.service.count()) > 0) {
    console.log("Services already exist. Skipping.");
    return;
  }

  const prescriptionCategory = await prisma.category.findUnique({ where: { slug: "prescription-services" } });
  const wellnessCategory = await prisma.category.findUnique({ where: { slug: "wellness-services" } });

  await prisma.service.createMany({
    data: [
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
    ],
  });
  console.log("Seeded services.");
}

async function seedProducts() {
  if ((await prisma.product.count()) > 0) {
    console.log("Products already exist. Skipping.");
    return;
  }

  const painReliefCategory = await prisma.category.findUnique({ where: { slug: "pain-relief" } });
  const vitaminsCategory = await prisma.category.findUnique({ where: { slug: "vitamins-supplements" } });
  const personalCareCategory = await prisma.category.findUnique({ where: { slug: "personal-care" } });

  await prisma.product.createMany({
    data: [
      {
        name: "Paracetamol 500mg",
        slug: "paracetamol-500mg",
        brandName: "Panadol",
        categoryId: painReliefCategory?.id,
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
        categoryId: vitaminsCategory?.id,
        generalUse: "Immune system support.",
        activeIngredient: "Ascorbic acid",
        formStrength: "1000mg tablet",
        requiresPrescription: false,
        availabilityStatus: "in_stock",
      },
      {
        name: "Hand Sanitizer Gel",
        slug: "hand-sanitizer-gel",
        categoryId: personalCareCategory?.id,
        generalUse: "Kills common germs without water.",
        requiresPrescription: false,
        availabilityStatus: "in_stock",
      },
      {
        name: "Amoxicillin 500mg",
        slug: "amoxicillin-500mg",
        categoryId: painReliefCategory?.id,
        generalUse: "Antibiotic for bacterial infections.",
        activeIngredient: "Amoxicillin",
        formStrength: "500mg capsule",
        requiresPrescription: true,
        availabilityStatus: "unknown",
      },
    ],
  });
  console.log("Seeded products.");
}

async function seedFaqs() {
  if ((await prisma.faq.count()) > 0) {
    console.log("FAQs already exist. Skipping.");
    return;
  }

  const faqs = [
    ["What services does the pharmacy provide?", "We offer prescription services, refills, medication counseling, health and wellness support, vaccinations and health screening."],
    ["What products are available?", "Medicines, vitamins and supplements, and personal care products. Browse the Products page for the full catalog."],
    ["Do I need a prescription for certain medicines?", "Yes, some medicines require a valid prescription. This is indicated on each product's page."],
    ["Can I request a prescription refill online?", "Yes, use the prescription refill form. Submitting a request does not guarantee approval or availability."],
    ["How can I find the nearest pharmacy branch?", "Use the Find a Pharmacy page to see all branches, addresses and opening hours."],
    ["How can I contact the pharmacy?", "Use the Contact Us page, call a branch directly, or reach us on WhatsApp where available."],
  ] as const;

  await prisma.faq.createMany({
    data: faqs.map(([question, answer], index) => ({ question, answer, displayOrder: index })),
  });
  console.log("Seeded FAQs.");
}

async function seedLocations() {
  if ((await prisma.pharmacyLocation.count()) > 0) {
    console.log("Locations already exist. Skipping.");
    return;
  }

  await prisma.pharmacyLocation.create({
    data: {
      slug: "ingata-pharmacy-kigali-city-branch",
      branchName: "Ingata Pharmacy - Kigali City Branch",
      address: "KN 4 Ave, Kigali, Rwanda",
      telephone: "+250788123456",
      latitude: -1.9441,
      longitude: 30.0619,
      openingHours: {
        monday: "8:00-20:00",
        tuesday: "8:00-20:00",
        wednesday: "8:00-20:00",
        thursday: "8:00-20:00",
        friday: "8:00-20:00",
        saturday: "9:00-18:00",
        sunday: "10:00-14:00",
      },
      availableServices: ["prescription-refills", "medication-counseling", "vaccination-services"],
    },
  });
  console.log("Seeded pharmacy locations.");
}

async function seedSiteSettings() {
  if ((await prisma.siteSetting.count()) > 0) {
    console.log("Site settings already exist. Skipping.");
    return;
  }

  await prisma.siteSetting.create({
    data: {
      pharmacyName: "Ingata Pharmacy",
      aboutUs:
        "Ingata Pharmacy is a customer-focused pharmacy committed to providing trusted pharmaceutical products, professional pharmacy services and reliable health information to the communities we serve.",
      mission:
        "To provide trusted pharmaceutical products and professional, customer-focused pharmacy services that contribute to the health and wellbeing of the communities we serve.",
      vision:
        "To become a trusted and accessible pharmacy partner recognized for quality products, professional service and exceptional customer care.",
      coreValues: ["Integrity", "Professionalism", "Customer Care", "Safety", "Accessibility", "Responsibility", "Trust", "Excellence"],
      heroHeadline: "Your Trusted Partner in Health and Wellness",
      heroSubheading:
        "Access trusted pharmacy services, approved health products and professional customer support designed to help you take better care of your health.",
      phone: "+250788123456",
      email: "info@ingata.example.com",
      address: "KN 4 Ave, Kigali, Rwanda",
    },
  });
  console.log("Seeded site settings.");
}

async function seedArticle() {
  if ((await prisma.article.count()) > 0) {
    console.log("Articles already exist. Skipping.");
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: "admin" } });

  if (!admin) {
    console.log("No admin user found. Run `npm run seed:admin` first to seed a sample article. Skipping.");
    return;
  }

  await prisma.article.create({
    data: {
      title: "5 Tips for Managing Your Blood Pressure Medication",
      slug: "5-tips-for-managing-your-blood-pressure-medication",
      content:
        "Consistent timing, proper storage and regular check-ins with your pharmacist all help you get the most from your blood pressure medication. Speak to our team if you have questions about your prescription.",
      category: "Health Tips",
      tags: ["hypertension", "medication-adherence"],
      authorId: admin.id,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Managing Blood Pressure Medication | Ingata Pharmacy",
      metaDescription: "Practical tips for taking your blood pressure medication safely and consistently.",
    },
  });
  console.log("Seeded a sample article.");
}

async function seedData() {
  await seedCategories();
  await seedServices();
  await seedProducts();
  await seedFaqs();
  await seedLocations();
  await seedSiteSettings();
  await seedArticle();

  await prisma.$disconnect();
}

seedData().catch((error) => {
  console.error("Failed to seed sample data:", error);
  process.exit(1);
});
