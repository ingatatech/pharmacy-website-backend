import { Request, Response } from "express";
import * as articleService from "../services/article.service";
import { parsePagination, setTotalCountHeader } from "../utils/pagination";
import { isNotFoundError } from "../db/errors";
import { CreateArticleInput, UpdateArticleInput } from "../validators/article.validator";

export async function list(req: Request, res: Response) {
  const [articles, total] = await articleService.findPublished(parsePagination(req));

  setTotalCountHeader(res, total);
  res.json(articles);
}

export async function listAllForAdmin(_req: Request, res: Response) {
  const articles = await articleService.findAllForAdmin();

  res.json(articles);
}

export async function getBySlug(req: Request, res: Response) {
  const article = await articleService.findPublishedBySlug(String(req.params.slug));

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  res.json(article);
}

export async function create(req: Request<{}, unknown, CreateArticleInput>, res: Response) {
  const article = await articleService.create(req.body, req.user!.userId);

  res.status(201).json(article);
}

export async function update(req: Request<{ id: string }, unknown, UpdateArticleInput>, res: Response) {
  try {
    const article = await articleService.update(req.params.id, req.body);
    res.json(article);
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Article not found." });
    }
    throw error;
  }
}

export async function submitForReview(req: Request<{ id: string }>, res: Response) {
  const article = await articleService.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  if (article.status !== "draft") {
    return res.status(400).json({ error: "Only draft articles can be submitted for review." });
  }

  const updated = await articleService.submitForReview(article.id);
  res.json(updated);
}

export async function approve(req: Request<{ id: string }>, res: Response) {
  const article = await articleService.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  if (article.status !== "pending_review") {
    return res.status(400).json({ error: "Only articles pending review can be approved." });
  }

  const updated = await articleService.approve(article.id, req.user!.userId);
  res.json(updated);
}

export async function reject(req: Request<{ id: string }>, res: Response) {
  const article = await articleService.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  if (article.status !== "pending_review") {
    return res.status(400).json({ error: "Only articles pending review can be rejected." });
  }

  const updated = await articleService.reject(article.id);
  res.json(updated);
}

export async function publish(req: Request<{ id: string }>, res: Response) {
  const article = await articleService.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  // Both admin and pharmacist_reviewer may publish at any point in the workflow:
  // the site owner should never be blocked by a review, and pharmacists are
  // trusted to review their own work or collaborate directly.
  const canSkipReview = req.user?.role === "admin" || req.user?.role === "pharmacist_reviewer";

  if (!canSkipReview && article.status !== "approved") {
    return res.status(400).json({ error: "Only approved articles can be published." });
  }

  const updated = await articleService.publish(article.id);
  res.json(updated);
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    await articleService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: "Article not found." });
    }
    throw error;
  }
}
