import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { createProductSchema, updateProductSchema } from "../validators/product.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all published products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter products by category slug
 *         example: pain-relief
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
 *         description: A list of published products. Total match count is returned in the X-Total-Count header.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/", productController.list);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search published products by name, brand name, or active ingredient
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match search term
 *         example: paracetamol
 *     responses:
 *       200:
 *         description: Matching published products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Missing required query parameter "q"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Registered before "/:slug" so Express doesn't match "search" as a slug value.
router.get("/search", productController.search);

/**
 * @swagger
 * /api/products/admin/all:
 *   get:
 *     summary: List every product, including unpublished drafts
 *     description: Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All products, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
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
// Registered before "/:slug" so Express doesn't match "admin" as a slug value.
router.get("/admin/all", authenticate, requireRole("admin", "pharmacist_reviewer"), productController.listAllForAdmin);

/**
 * @swagger
 * /api/products/{slug}:
 *   get:
 *     summary: Get a single published product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: paracetamol-500mg
 *     responses:
 *       200:
 *         description: The requested product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:slug", productController.getBySlug);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string, example: "Paracetamol 500mg" }
 *               slug: { type: string, example: "paracetamol-500mg" }
 *               brandName: { type: string, nullable: true, example: "Panadol" }
 *               generalDescription: { type: string, nullable: true }
 *               generalUse: { type: string, nullable: true, example: "Relief of mild to moderate pain and fever." }
 *               precautions: { type: string, nullable: true }
 *               storageInformation: { type: string, nullable: true }
 *               activeIngredient: { type: string, nullable: true, example: "Paracetamol" }
 *               formStrength: { type: string, nullable: true, example: "500mg tablet" }
 *               manufacturer: { type: string, nullable: true, example: "GSK" }
 *               dosageInformation: { type: string, nullable: true }
 *               requiresPrescription: { type: boolean, example: false }
 *               availabilityStatus: { type: string, enum: [in_stock, out_of_stock, unknown] }
 *               imageUrl: { type: string, nullable: true }
 *               isPublished: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: The created product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
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
  validateBody(createProductSchema),
  productController.create
);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Update an existing product
 *     description: Requires admin role.
 *     tags: [Products]
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
 *               name: { type: string }
 *               availabilityStatus: { type: string, enum: [in_stock, out_of_stock, unknown] }
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
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
 *         description: Product not found
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
  validateBody(updateProductSchema),
  productController.update
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Requires admin role.
 *     tags: [Products]
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
 *         description: Product deleted successfully
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
 *         description: Product not found
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
  productController.remove
);

export default router;
