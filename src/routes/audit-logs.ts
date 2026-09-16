import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog";
import { authenticate, requireRole } from "../middleware/auth";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";

const router = Router();

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: List administrative action history, newest first
 *     description: Requires admin role. Records every authenticated create/update/delete request that succeeded.
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
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
 *         description: Audit log entries. Total match count is returned in the X-Total-Count header.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
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
router.get("/", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const auditLogRepository = AppDataSource.getRepository(AuditLog);
  const [entries, total] = await auditLogRepository.findAndCount({
    relations: { actor: true },
    order: { createdAt: "DESC" },
    ...parsePagination(req),
  });

  setTotalCountHeader(res, total);
  res.json(entries);
});

export default router;
