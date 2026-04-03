import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.params) {
      const parsed = schemas.params.parse(req.params);
      Object.assign(req.params, parsed);
    }
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query);
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, parsed);
    }
    next();
  };
}
