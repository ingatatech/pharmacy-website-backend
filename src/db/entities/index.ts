export { Article } from "./article.entity";
export { AuditLog } from "./audit-log.entity";
export { Category } from "./category.entity";
export { ContactInquiry } from "./contact-inquiry.entity";
export { Faq } from "./faq.entity";
export { PharmacyLocation } from "./pharmacy-location.entity";
export { Product } from "./product.entity";
export { RefillRequest } from "./refill-request.entity";
export { Service } from "./service.entity";
export { SiteSetting } from "./site-setting.entity";
export { TeamMember } from "./team-member.entity";
export { Testimonial } from "./testimonial.entity";
export { User } from "./user.entity";

import { Article } from "./article.entity";
import { AuditLog } from "./audit-log.entity";
import { Category } from "./category.entity";
import { ContactInquiry } from "./contact-inquiry.entity";
import { Faq } from "./faq.entity";
import { PharmacyLocation } from "./pharmacy-location.entity";
import { Product } from "./product.entity";
import { RefillRequest } from "./refill-request.entity";
import { Service } from "./service.entity";
import { SiteSetting } from "./site-setting.entity";
import { TeamMember } from "./team-member.entity";
import { Testimonial } from "./testimonial.entity";
import { User } from "./user.entity";

/** Explicit list — TypeORM resolves relations from these, so none may be omitted. */
export const entities = [
  Article,
  AuditLog,
  Category,
  ContactInquiry,
  Faq,
  PharmacyLocation,
  Product,
  RefillRequest,
  Service,
  SiteSetting,
  TeamMember,
  Testimonial,
  User,
];