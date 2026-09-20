export type UserRole = "admin" | "pharmacist_reviewer";

export type CategoryType = "service" | "product";

export type ProductAvailabilityStatus = "in_stock" | "out_of_stock" | "unknown";

export type ArticleStatus = "draft" | "pending_review" | "approved" | "published";

export type ContactInquiryStatus = "new" | "in_progress" | "resolved";

export type RefillRequestStatus = "submitted" | "under_review" | "approved" | "rejected" | "completed";

export interface WeeklyOpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}
