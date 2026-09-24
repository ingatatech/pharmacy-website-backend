import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition: swaggerJsdoc.SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Ingata Pharmacy API",
    version: "1.0.0",
    description: "API for the Ingata Pharmacy corporate and customer-service website",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development",
    },
  ],
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
      PharmacyLocation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
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
          role: { type: "string", enum: ["admin", "pharmacist_reviewer"], example: "pharmacist_reviewer" },
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

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [routesGlob],
});

export default swaggerSpec;
