import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PharmacyLocation } from "../entities/PharmacyLocation";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: List all active pharmacy locations
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: A list of active pharmacy locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PharmacyLocation'
 */
router.get("/", async (_req: Request, res: Response) => {
  const locationRepository = AppDataSource.getRepository(PharmacyLocation);
  const locations = await locationRepository.find({
    where: { isActive: true },
  });

  res.json(locations);
});

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new pharmacy location
 *     description: Requires admin role.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchName, address]
 *             properties:
 *               branchName: { type: string, example: "Ingata Pharmacy - Kigali City Branch" }
 *               address: { type: string, example: "KN 4 Ave, Kigali, Rwanda" }
 *               telephone: { type: string, nullable: true, example: "+250788123456" }
 *               latitude: { type: number, nullable: true, example: -1.9441 }
 *               longitude: { type: number, nullable: true, example: 30.0619 }
 *               openingHours:
 *                 type: object
 *                 nullable: true
 *                 example: { monday: "8:00-20:00", tuesday: "8:00-20:00" }
 *               availableServices:
 *                 type: array
 *                 nullable: true
 *                 items: { type: string }
 *                 example: ["prescription-refills", "vaccinations"]
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: The created pharmacy location
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PharmacyLocation'
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
  const locationRepository = AppDataSource.getRepository(PharmacyLocation);
  const location = locationRepository.create(req.body);
  await locationRepository.save(location);

  res.status(201).json(location);
});

/**
 * @swagger
 * /api/locations/{id}:
 *   patch:
 *     summary: Update an existing pharmacy location
 *     description: Requires admin role.
 *     tags: [Locations]
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
 *               branchName: { type: string }
 *               telephone: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: The updated pharmacy location
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PharmacyLocation'
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
 *         description: Pharmacy location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const locationRepository = AppDataSource.getRepository(PharmacyLocation);
  const location = await locationRepository.findOne({ where: { id: String(req.params.id) } });

  if (!location) {
    return res.status(404).json({ error: "Pharmacy location not found." });
  }

  locationRepository.merge(location, req.body);
  await locationRepository.save(location);

  res.json(location);
});

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a pharmacy location
 *     description: Requires admin role.
 *     tags: [Locations]
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
 *         description: Pharmacy location deleted successfully
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
 *         description: Pharmacy location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const locationRepository = AppDataSource.getRepository(PharmacyLocation);
  const result = await locationRepository.delete({ id: String(req.params.id) });

  if (result.affected === 0) {
    return res.status(404).json({ error: "Pharmacy location not found." });
  }

  res.status(204).send();
});

export default router;
