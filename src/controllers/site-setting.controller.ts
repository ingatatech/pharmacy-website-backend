import { Request, Response } from "express";
import * as siteSettingService from "../services/site-setting.service";
import { UpdateSiteSettingInput } from "../validators/site-setting.validator";

export async function get(_req: Request, res: Response) {
  const settings = await siteSettingService.get();

  res.json(settings ?? {});
}

export async function update(req: Request<{}, unknown, UpdateSiteSettingInput>, res: Response) {
  const settings = await siteSettingService.upsert(req.body);

  res.json(settings);
}
