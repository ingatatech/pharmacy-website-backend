import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Article } from "../entities/Article";
import { User } from "../entities/User";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: List all published articles, newest first
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: A list of published articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 */
router.get("/", async (_req: Request, res: Response) => {
  const articleRepository = AppDataSource.getRepository(Article);
  const articles = await articleRepository.find({
    where: { status: "published" },
    relations: { author: true },
    order: { publishedAt: "DESC" },
  });

  res.json(articles);
});

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
  async (_req: Request, res: Response) => {
    const articleRepository = AppDataSource.getRepository(Article);
    const articles = await articleRepository.find({
      relations: { author: true, reviewer: true },
      order: { createdAt: "DESC" },
    });

    res.json(articles);
  }
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
router.get("/:slug", async (req: Request, res: Response) => {
  const articleRepository = AppDataSource.getRepository(Article);
  const article = await articleRepository.findOne({
    where: { slug: String(req.params.slug), status: "published" },
    relations: { author: true, reviewer: true },
  });

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  res.json(article);
});

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
router.post("/", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const articleRepository = AppDataSource.getRepository(Article);
  const article = articleRepository.create({
    ...req.body,
    status: "draft",
    author: { id: req.user!.userId } as User,
  });
  await articleRepository.save(article);

  res.status(201).json(article);
});

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
router.patch("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const articleRepository = AppDataSource.getRepository(Article);
  const article = await articleRepository.findOne({ where: { id: String(req.params.id) } });

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  articleRepository.merge(article, req.body);
  await articleRepository.save(article);

  res.json(article);
});

/**
 * @swagger
 * /api/articles/{id}/submit-for-review:
 *   post:
 *     summary: Submit a draft article for pharmacist review
 *     description: Requires admin role. Only articles with status "draft" can be submitted; moves status to "pending_review".
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
router.post(
  "/:id/submit-for-review",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: String(req.params.id) } });

    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    if (article.status !== "draft") {
      return res.status(400).json({ error: "Only draft articles can be submitted for review." });
    }

    article.status = "pending_review";
    await articleRepository.save(article);

    res.json(article);
  }
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
  async (req: Request, res: Response) => {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: String(req.params.id) } });

    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    if (article.status !== "pending_review") {
      return res.status(400).json({ error: "Only articles pending review can be approved." });
    }

    article.status = "approved";
    article.reviewer = { id: req.user!.userId } as User;
    article.lastReviewedAt = new Date();
    await articleRepository.save(article);

    res.json(article);
  }
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
  async (req: Request, res: Response) => {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: String(req.params.id) } });

    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    if (article.status !== "pending_review") {
      return res.status(400).json({ error: "Only articles pending review can be rejected." });
    }

    article.status = "draft";
    article.lastReviewedAt = new Date();
    await articleRepository.save(article);

    res.json(article);
  }
);

/**
 * @swagger
 * /api/articles/{id}/publish:
 *   post:
 *     summary: Publish an approved article
 *     description: Requires admin role. Only articles with status "approved" can be published; sets publishedAt and moves status to "published".
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
 *         description: Article is not in "approved" status
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
router.post(
  "/:id/publish",
  authenticate,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const articleRepository = AppDataSource.getRepository(Article);
    const article = await articleRepository.findOne({ where: { id: String(req.params.id) } });

    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    if (article.status !== "approved") {
      return res.status(400).json({ error: "Only approved articles can be published." });
    }

    article.status = "published";
    article.publishedAt = new Date();
    await articleRepository.save(article);

    res.json(article);
  }
);

export default router;
