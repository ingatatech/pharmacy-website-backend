import { Router } from "express";
import * as articleController from "../controllers/article.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createArticleSchema, updateArticleSchema } from "../validators/article.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: List all published articles, newest first
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number (1-indexed). Omit both page and limit to get the full list.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Results per page (default 50, max 200).
 *     responses:
 *       200:
 *         description: A list of published articles. Total match count is returned in the X-Total-Count header.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 */
router.get("/", articleController.list);

/**
 * @swagger
 * /api/articles/admin/all:
 *   get:
 *     summary: List every article regardless of status (draft, pending_review, approved, published)
 *     description: Requires admin or pharmacist_reviewer role.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All articles, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the admin or pharmacist_reviewer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Registered before "/:slug" so Express doesn't match "admin" as a slug value.
router.get(
  "/admin/all",
  authenticate,
  requireRole("admin", "pharmacist_reviewer"),
  articleController.listAllForAdmin
);

/**
 * @swagger
 * /api/articles/{slug}:
 *   get:
 *     summary: Get a single published article by slug
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: 5-tips-for-managing-your-blood-pressure-medication
 *     responses:
 *       200:
 *         description: The requested article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:slug", articleController.getBySlug);

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Create a new article
 *     description: Requires admin role. Status is always created as "draft" and the author is set to the authenticated user.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, content]
 *             properties:
 *               title: { type: string, example: "5 Tips for Managing Your Blood Pressure Medication" }
 *               slug: { type: string, example: "5-tips-for-managing-your-blood-pressure-medication" }
 *               content: { type: string }
 *               featuredImageUrl: { type: string, nullable: true }
 *               category: { type: string, nullable: true, example: "Health Tips" }
 *               tags:
 *                 type: array
 *                 nullable: true
 *                 items: { type: string }
 *                 example: ["hypertension", "medication-adherence"]
 *               metaTitle: { type: string, nullable: true }
 *               metaDescription: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: The created article, with status "draft"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authenticate,
  requireRole("admin", "pharmacist_reviewer"),
  validateBody(createArticleSchema),
  articleController.create
);

/**
 * @swagger
 * /api/articles/{id}:
 *   patch:
 *     summary: Update an article's content
 *     description: Requires admin role.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               featuredImageUrl: { type: string, nullable: true }
 *               metaTitle: { type: string, nullable: true }
 *               metaDescription: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: The updated article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:id",
  authenticate,
  requireRole("admin", "pharmacist_reviewer"),
  validateParams(idParamSchema),
  validateBody(updateArticleSchema),
  articleController.update
);

/**
 * @swagger
 * /api/articles/{id}/submit-for-review:
 *   post:
 *     summary: Submit a draft article for pharmacist review
 *     description: Requires admin or pharmacist_reviewer. Both roles may create articles, so both may send one for review. Only articles with status "draft" can be submitted; moves status to "pending_review".
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The article, now with status "pending_review"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Article is not in "draft" status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller is neither admin nor pharmacist_reviewer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/submit-for-review",
  authenticate,
  requireRole("admin", "pharmacist_reviewer"),
  validateParams(idParamSchema),
  articleController.submitForReview
);

/**
 * @swagger
 * /api/articles/{id}/approve:
 *   post:
 *     summary: Approve an article that is pending review
 *     description: Requires pharmacist_reviewer role — admin alone cannot approve. Only articles with status "pending_review" can be approved; sets reviewer and lastReviewedAt, and moves status to "approved".
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The article, now with status "approved"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Article is not in "pending_review" status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the pharmacist_reviewer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/approve",
  authenticate,
  requireRole("pharmacist_reviewer"),
  validateParams(idParamSchema),
  articleController.approve
);

/**
 * @swagger
 * /api/articles/{id}/reject:
 *   post:
 *     summary: Reject an article that is pending review
 *     description: Requires pharmacist_reviewer role. Only articles with status "pending_review" can be rejected; sends the article back to "draft".
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The article, now with status "draft"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Article is not in "pending_review" status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the pharmacist_reviewer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/reject",
  authenticate,
  requireRole("pharmacist_reviewer"),
  validateParams(idParamSchema),
  articleController.reject
);

/**
 * @swagger
 * /api/articles/{id}/publish:
 *   post:
 *     summary: Publish an article
 *     description: >
 *       Requires admin or pharmacist_reviewer. An admin may publish an article
 *       from any status (draft, pending_review or approved). Any other role must
 *       wait until the status is "approved", i.e. until a pharmacist has signed
 *       off. Sets publishedAt and moves status to "published". Only articles
 *       with status "published" are returned by the public API.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The article, now with status "published"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Caller is not an admin and the article is not in "approved" status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller is neither admin nor pharmacist_reviewer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/publish",
  authenticate,
  requireRole("admin", "pharmacist_reviewer"),
  validateParams(idParamSchema),
  articleController.publish
);

/**
 * @swagger
 * /api/articles/{id}:
 *   delete:
 *     summary: Delete an article
 *     description: Requires admin or pharmacist_reviewer. Permanently removes the article.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Article deleted successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller does not have the required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  authenticate,
  requireRole("admin", "pharmacist_reviewer"),
  validateParams(idParamSchema),
  articleController.remove
);

export default router;
