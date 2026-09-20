import { Request, Response } from "express";
import * as auditLogService from "../services/audit-log.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";

export async function list(req: Request, res: Response) {
  const [entries, total] = await auditLogService.findAll(parsePagination(req));

  setTotalCountHeader(res, total);
  res.json(entries);
}
