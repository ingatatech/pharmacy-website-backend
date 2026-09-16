import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { SiteSetting } from "../entities/SiteSetting";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/site-settings:
 *   get:
 *     summary: Get the pharmacy's corporate content and contact/social settings
 *     description: Used for About Us, mission/vision/values, homepage hero copy, footer contact info, and social links.
 *     tags: [SiteSettings]
 *     responses:
 *       200:
 *         description: The current site settings, or an empty object if none have been set yet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteSetting'
 */
router.get("/", async (_req: Request, res: Response) => {
  const siteSettingRepository = AppDataSource.getRepository(SiteSetting);
  const settings = await siteSettingRepository.find({ take: 1 });

  res.json(settings[0] ?? {});
});

/**
 * @swagger
 * /api/site-settings:
 *   patch:
 *     summary: Update the pharmacy's corporate content and contact/social settings
 *     description: Requires admin role. Creates the settings record on first use.
 *     tags: [SiteSettings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pharmacyName: { type: string, nullable: true }
 *               aboutUs: { type: string, nullable: true }
 *               mission: { type: string, nullable: true }
 *               vision: { type: string, nullable: true }
 *               coreValues:
 *                 type: array
 *                 nullable: true
 *                 items: { type: string }
 *                 example: ["Integrity", "Professionalism", "Customer Care"]
 *               whyChooseUs: { type: string, nullable: true }
 *               heroHeadline: { type: string, nullable: true, example: "Your Trusted Partner in Health and Wellness" }
 *               heroSubheading: { type: string, nullable: true }
 *               phone: { type: string, nullable: true }
 *               email: { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *               facebookUrl: { type: string, nullable: true }
 *               instagramUrl: { type: string, nullable: true }
 *               linkedinUrl: { type: string, nullable: true }
 *               xUrl: { type: string, nullable: true }
 *               whatsappUrl: { type: string, nullable: true }
 *               youtubeUrl: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: The updated site settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteSetting'
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
router.patch("/", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const siteSettingRepository = AppDataSource.getRepository(SiteSetting);
  const existing = await siteSettingRepository.find({ take: 1 });

  const settings = existing[0] ?? siteSettingRepository.create();
  siteSettingRepository.merge(settings, req.body);
  await siteSettingRepository.save(settings);

  res.json(settings);
});

export default router;
