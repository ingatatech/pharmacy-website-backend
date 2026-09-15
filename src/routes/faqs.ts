import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Faq } from "../entities/Faq";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     summary: List all published FAQs, ordered by display order
 *     tags: [Faqs]
 *     responses:
 *       200:
 *         description: A list of published FAQs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Faq'
 */
router.get("/", async (_req: Request, res: Response) => {
  const faqRepository = AppDataSource.getRepository(Faq);
  const faqs = await faqRepository.find({
    where: { isPublished: true },
    order: { displayOrder: "ASC" },
  });

  res.json(faqs);
});

/**
 * @swagger
 * /api/faqs:
 *   post:
 *     summary: Create a new FAQ
 *     description: Requires admin role.
 *     tags: [Faqs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string, example: "Do you accept insurance?" }
 *               answer: { type: string, example: "Yes, we work with most major insurance providers." }
 *               displayOrder: { type: integer, example: 1 }
 *               isPublished: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: The created FAQ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Faq'
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
  const faqRepository = AppDataSource.getRepository(Faq);
  const faq = faqRepository.create(req.body);
  await faqRepository.save(faq);

  res.status(201).json(faq);
});

/**
 * @swagger
 * /api/faqs/{id}:
 *   patch:
 *     summary: Update an existing FAQ
 *     description: Requires admin role.
 *     tags: [Faqs]
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
 *               question: { type: string }
 *               answer: { type: string }
 *               displayOrder: { type: integer }
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated FAQ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Faq'
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
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const faqRepository = AppDataSource.getRepository(Faq);
  const faq = await faqRepository.findOne({ where: { id: String(req.params.id) } });

  if (!faq) {
    return res.status(404).json({ error: "FAQ not found." });
  }

  faqRepository.merge(faq, req.body);
  await faqRepository.save(faq);

  res.json(faq);
});

/**
 * @swagger
 * /api/faqs/{id}:
 *   delete:
 *     summary: Delete a FAQ
 *     description: Requires admin role.
 *     tags: [Faqs]
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
 *         description: FAQ deleted successfully
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
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const faqRepository = AppDataSource.getRepository(Faq);
  const result = await faqRepository.delete({ id: String(req.params.id) });

  if (result.affected === 0) {
    return res.status(404).json({ error: "FAQ not found." });
  }

  res.status(204).send();
});

export default router;
