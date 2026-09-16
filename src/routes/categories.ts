import { Router, Request, Response } from "express";
import { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../data-source";
import { Category, CategoryType } from "../entities/Category";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [service, product]
 *         description: Filter categories by type
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/", async (req: Request, res: Response) => {
  const categoryRepository = AppDataSource.getRepository(Category);
  const type = req.query.type ? (String(req.query.type) as CategoryType) : undefined;

  const where: FindOptionsWhere<Category> = {};
  if (type) {
    where.type = type;
  }

  const categories = await categoryRepository.find({ where, order: { name: "ASC" } });

  res.json(categories);
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     description: Requires admin role.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, type]
 *             properties:
 *               name: { type: string, example: "Vitamins & Supplements" }
 *               slug: { type: string, example: "vitamins-supplements" }
 *               type: { type: string, enum: [service, product] }
 *     responses:
 *       201:
 *         description: The created category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
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
router.post("/", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const categoryRepository = AppDataSource.getRepository(Category);
  const category = categoryRepository.create(req.body);
  await categoryRepository.save(category);

  res.status(201).json(category);
});

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update an existing category
 *     description: Requires admin role.
 *     tags: [Categories]
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
 *               slug: { type: string }
 *               type: { type: string, enum: [service, product] }
 *     responses:
 *       200:
 *         description: The updated category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const categoryRepository = AppDataSource.getRepository(Category);
  const category = await categoryRepository.findOne({ where: { id: String(req.params.id) } });

  if (!category) {
    return res.status(404).json({ error: "Category not found." });
  }

  categoryRepository.merge(category, req.body);
  await categoryRepository.save(category);

  res.json(category);
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Requires admin role.
 *     tags: [Categories]
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
 *         description: Category deleted successfully
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const categoryRepository = AppDataSource.getRepository(Category);
  const result = await categoryRepository.delete({ id: String(req.params.id) });

  if (result.affected === 0) {
    return res.status(404).json({ error: "Category not found." });
  }

  res.status(204).send();
});

export default router;
