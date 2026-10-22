import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition: swaggerJsdoc.SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Ingata Pharmacy API",
    version: "1.0.0",
    summary: "Backend for the Ingata Pharmacy website — content management, customer requests and staff workflows.",
    description: "RESTful API for the Ingata Pharmacy platform, powering both the public-facing website and the administrative back-office interfaces.",
  },
  servers: [
    {
      // A relative URL rather than an absolute one, so "Try it out" targets
      // whatever host is actually serving the docs — localhost in development,
      // the Render URL in production — with no configuration.
      url: "/",
      description: "Current server",
    },
  ],
  // Declared up front so the sidebar groups operations in this order and each
  // group carries a one-line explanation. Names must match the tags used by the
  // routes exactly, otherwise Swagger UI falls back to an alphabetical,
  // undescribed group.
  tags: [
    { name: "Health", description: "Uptime and readiness checks" },
    { name: "Auth", description: "Sign up, log in and manage your own profile" },
    { name: "Services", description: "Pharmacy services shown on the public site" },
    { name: "Products", description: "Retail products shown in the public catalogue" },
    { name: "Categories", description: "Product categories" },
    { name: "Faqs", description: "Frequently asked questions" },
    { name: "Testimonials", description: "Customer testimonials" },
    { name: "Locations", description: "Branches and opening hours" },
    { name: "Team", description: "Staff members listed on the public site" },
    { name: "Articles", description: "Blog posts, with a pharmacist review workflow" },
    { name: "SiteSettings", description: "Global site content and branding" },
    { name: "Contact", description: "Public contact form and its handling" },
    { name: "Refill", description: "Public prescription refill requests and their handling" },
    { name: "Uploads", description: "Image upload to Cloudinary, used by the content forms" },
    { name: "Pharmacist", description: "Read-only views of the pharmacist workspace" },
  ],
  paths: {
    "/api/health": {
      get: {
        summary: "Service health check",
        description: "Public. Returns 200 with { status: \"ok\" } while the API process is running.",
        tags: ["Health"],
        responses: {
          200: {
            description: "The API is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Resource not found." },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Please check the highlighted fields and try again." },
          details: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Prescription Services" },
          slug: { type: "string", example: "prescription-services" },
          type: { type: "string", enum: ["service", "product"] },
        },
      },
      Service: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Prescription Refills" },
          slug: { type: "string", example: "prescription-refills" },
          shortDescription: { type: "string", example: "Fast, convenient refills for your ongoing medication." },
          detailedDescription: { type: "string", nullable: true },
          imageUrl: { type: "string", nullable: true, example: "https://ingata.example.com/images/refills.jpg" },
          keyBenefit: { type: "string", nullable: true, example: "No need to wait in line at the counter." },
          intendedCustomers: { type: "string", nullable: true },
          requirements: { type: "string", nullable: true },
          process: { type: "string", nullable: true },
          limitations: { type: "string", nullable: true },
          category: { $ref: "#/components/schemas/Category" },
          metaTitle: { type: "string", nullable: true },
          metaDescription: { type: "string", nullable: true },
          isPublished: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Paracetamol 500mg" },
          slug: { type: "string", example: "paracetamol-500mg" },
          brandName: { type: "string", nullable: true, example: "Panadol" },
          category: { $ref: "#/components/schemas/Category" },
          generalDescription: { type: "string", nullable: true },
          generalUse: { type: "string", nullable: true, example: "Relief of mild to moderate pain and fever." },
          precautions: { type: "string", nullable: true },
          storageInformation: { type: "string", nullable: true, example: "Store below 25°C in a dry place." },
          activeIngredient: { type: "string", nullable: true, example: "Paracetamol" },
          formStrength: { type: "string", nullable: true, example: "500mg tablet" },
          manufacturer: { type: "string", nullable: true, example: "GSK" },
          dosageInformation: { type: "string", nullable: true },
          requiresPrescription: { type: "boolean", example: false },
          availabilityStatus: { type: "string", enum: ["in_stock", "out_of_stock", "unknown"], example: "in_stock" },
          imageUrl: { type: "string", nullable: true },
          metaTitle: { type: "string", nullable: true },
          metaDescription: { type: "string", nullable: true },
          isPublished: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Faq: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          question: { type: "string", example: "Do you accept insurance?" },
          answer: { type: "string", example: "Yes, we work with most major insurance providers." },
          displayOrder: { type: "integer", example: 1 },
          isPublished: { type: "boolean", example: true },
        },
      },
      Testimonial: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          customerName: { type: "string", example: "Jane U." },
          customerCategory: { type: "string", nullable: true, example: "Chronic-care customer" },
          testimonialText: { type: "string", example: "The pharmacist walked me through every question I had about my prescription." },
          photoUrl: { type: "string", nullable: true, example: "/uploads/jane.jpg" },
          displayOrder: { type: "integer", example: 1 },
          isPublished: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PharmacyLocation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string", example: "ingata-pharmacy-kigali-city-branch" },
          branchName: { type: "string", example: "Ingata Pharmacy - Kigali City Branch" },
          address: { type: "string", example: "KN 4 Ave, Kigali, Rwanda" },
          telephone: { type: "string", nullable: true, example: "+250788123456" },
          latitude: { type: "number", nullable: true, example: -1.9441 },
          longitude: { type: "number", nullable: true, example: 30.0619 },
          openingHours: {
            type: "object",
            nullable: true,
            example: { monday: "8:00-20:00", tuesday: "8:00-20:00" },
          },
          availableServices: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["prescription-refills", "vaccinations"],
          },
          isActive: { type: "boolean", example: true },
          description: { type: "string", nullable: true, example: "Our flagship branch in the city center, open since 2015." },
          photoUrl: { type: "string", nullable: true, example: "/uploads/kigali-city-branch.jpg" },
        },
      },
      TeamMember: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string", example: "Dr. Alice Uwase" },
          role: { type: "string", example: "Licensed Pharmacist" },
          credentials: { type: "string", nullable: true, example: "B.Pharm, PharmD" },
          bio: { type: "string", nullable: true },
          photoUrl: { type: "string", nullable: true, example: "/uploads/alice.jpg" },
          displayOrder: { type: "integer", example: 1 },
          isPublished: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          locationId: { type: "string", format: "uuid", nullable: true },
        },
      },
      Article: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "5 Tips for Managing Your Blood Pressure Medication" },
          slug: { type: "string", example: "5-tips-for-managing-your-blood-pressure-medication" },
          content: { type: "string" },
          featuredImageUrl: { type: "string", nullable: true },
          category: { type: "string", nullable: true, example: "Health Tips" },
          tags: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["hypertension", "medication-adherence"],
          },
          author: { $ref: "#/components/schemas/PublicUser" },
          reviewer: { $ref: "#/components/schemas/PublicUser" },
          status: {
            type: "string",
            enum: ["draft", "pending_review", "approved", "published"],
            example: "published",
          },
          publishedAt: { type: "string", format: "date-time", nullable: true },
          lastReviewedAt: { type: "string", format: "date-time", nullable: true },
          metaTitle: { type: "string", nullable: true },
          metaDescription: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email", example: "reviewer@ingata.com" },
          fullName: { type: "string", example: "Dr. Alice Uwase" },
          role: { type: "string", enum: ["customer", "pharmacist_reviewer", "admin"], example: "customer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ContactInquiry: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string", example: "Jane Doe" },
          phoneNumber: { type: "string", example: "0788123456" },
          email: { type: "string", format: "email", example: "jane.doe@example.com" },
          subject: { type: "string", nullable: true, example: "Question about opening hours" },
          inquiryType: { type: "string", nullable: true, enum: ["general", "health", "product", "service"], example: "general" },
          message: { type: "string", example: "What time do you open on Saturdays?" },
          preferredContactMethod: { type: "string", nullable: true, example: "phone" },
          preferredBranch: { type: "string", nullable: true, example: "Kigali City Branch" },
          status: { type: "string", enum: ["new", "in_progress", "resolved"], example: "new" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      RefillRequest: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string", example: "Jane Doe" },
          phoneNumber: { type: "string", example: "0788123456" },
          email: { type: "string", format: "email", nullable: true, example: "jane.doe@example.com" },
          preferredBranch: { type: "string", nullable: true, example: "Kigali City Branch" },
          prescriptionReference: { type: "string", nullable: true, example: "RX-2026-00123" },
          medicationName: { type: "string", nullable: true, example: "Amoxicillin 500mg" },
          additionalNotes: { type: "string", nullable: true },
          preferredPickupMethod: { type: "string", nullable: true, example: "in-store pickup" },
          status: {
            type: "string",
            enum: ["submitted", "under_review", "approved", "rejected", "completed"],
            example: "submitted",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      SiteSetting: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          pharmacyName: { type: "string", nullable: true, example: "Ingata Pharmacy" },
          aboutUs: { type: "string", nullable: true },
          mission: { type: "string", nullable: true },
          vision: { type: "string", nullable: true },
          coreValues: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["Integrity", "Professionalism", "Customer Care"],
          },
          whyChooseUs: { type: "string", nullable: true },
          heroHeadline: { type: "string", nullable: true, example: "Your Trusted Partner in Health and Wellness" },
          heroSubheading: { type: "string", nullable: true },
          phone: { type: "string", nullable: true, example: "+250788123456" },
          email: { type: "string", nullable: true, example: "info@ingata.example.com" },
          address: { type: "string", nullable: true, example: "KN 4 Ave, Kigali, Rwanda" },
          facebookUrl: { type: "string", nullable: true },
          instagramUrl: { type: "string", nullable: true },
          linkedinUrl: { type: "string", nullable: true },
          xUrl: { type: "string", nullable: true },
          whatsappUrl: { type: "string", nullable: true },
          youtubeUrl: { type: "string", nullable: true },
          announcementMessage: { type: "string", nullable: true, example: "We're closed on 1 Jan for the public holiday." },
          announcementActive: { type: "boolean", example: false },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          actor: { $ref: "#/components/schemas/PublicUser" },
          method: { type: "string", example: "PATCH" },
          path: { type: "string", example: "/api/articles/abc123/publish" },
          statusCode: { type: "integer", example: 200 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ContactInquiryInput: {
        type: "object",
        required: ["fullName", "phoneNumber", "email", "message"],
        properties: {
          fullName: { type: "string", example: "Jane Doe" },
          phoneNumber: { type: "string", example: "0788123456" },
          email: { type: "string", format: "email", example: "jane.doe@example.com" },
          subject: { type: "string", nullable: true, example: "Question about opening hours" },
          inquiryType: { type: "string", enum: ["general", "health", "product", "service"], example: "general" },
          message: { type: "string", minLength: 5, example: "What time do you open on Saturdays?" },
          preferredContactMethod: { type: "string", nullable: true, example: "phone" },
          preferredBranch: { type: "string", nullable: true, example: "Kigali City Branch" },
        },
      },
      RefillRequestInput: {
        type: "object",
        required: ["fullName", "phoneNumber"],
        properties: {
          fullName: { type: "string", example: "Jane Doe" },
          phoneNumber: { type: "string", example: "0788123456" },
          email: { type: "string", format: "email", nullable: true, example: "jane.doe@example.com" },
          preferredBranch: { type: "string", nullable: true, example: "Kigali City Branch" },
          prescriptionReference: { type: "string", nullable: true, example: "RX-2026-00123" },
          medicationName: { type: "string", nullable: true, example: "Amoxicillin 500mg" },
          additionalNotes: { type: "string", nullable: true },
          preferredPickupMethod: { type: "string", nullable: true, example: "in-store pickup" },
        },
      },
    },
  },
};

// swagger-jsdoc's internal glob matching breaks on Windows-style backslash
// paths, so the resolved path is normalized to forward slashes here.
const routesGlob = path.join(__dirname, "routes", "*.{ts,js}").split(path.sep).join("/");

// The docs expose the full content-management API — every read, create, update
// and delete — so data can be managed straight from the Swagger UI (log in via
// /api/auth/login, then use the Authorize button to attach the bearer token).
//
// Two surfaces are removed from the docs completely:
//   /api/admin/*     user administration (an admin account is created only by
//                    the seed script; pharmacists are added by an admin here,
//                    so this is deliberately not published)
//   /api/audit-logs  internal audit trail
//
// The pharmacist workspace is a special case: its GET endpoints are shown, but
// its write endpoints are not, since adding or changing data is an admin job.
const HIDDEN_PATH_PREFIXES = ["/api/admin", "/api/audit-logs"];
const READ_ONLY_PATH_PREFIXES = ["/api/pharmacist"];
const READ_ONLY_METHODS = ["get"];

type SwaggerSpec = { paths?: Record<string, Record<string, any>> } & Record<string, any>;

function applyVisibility(spec: SwaggerSpec): SwaggerSpec {
  const visiblePaths: Record<string, Record<string, any>> = {};

  for (const [routePath, pathItem] of Object.entries(spec.paths ?? {})) {
    if (HIDDEN_PATH_PREFIXES.some((prefix) => routePath.startsWith(prefix))) {
      continue;
    }

    const operations: Record<string, any> = {};
    for (const [method, operation] of Object.entries(pathItem)) {
      const isHiddenWrite =
        READ_ONLY_PATH_PREFIXES.some((prefix) => routePath.startsWith(prefix)) &&
        !READ_ONLY_METHODS.includes(method.toLowerCase());

      if (!isHiddenWrite) {
        operations[method] = operation;
      }
    }

    if (Object.keys(operations).length > 0) {
      visiblePaths[routePath] = operations;
    }
  }

  return { ...spec, paths: visiblePaths };
}

const swaggerSpec = applyVisibility(
  swaggerJsdoc({
    definition: swaggerDefinition,
    apis: [routesGlob],
  }) as SwaggerSpec
);

export default swaggerSpec;
