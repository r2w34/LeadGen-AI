import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const signupValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate,
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

export const leadValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('fitScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Fit score must be between 0 and 100'),
  validate,
];

export const generateLeadsValidation = [
  body('industry').optional().isString(),
  body('location').optional().isString(),
  body('companySize').optional().isString(),
  validate,
];

export const sendEmailValidation = [
  body('to').isEmail().withMessage('Valid recipient email required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('body').trim().notEmpty().withMessage('Email body is required'),
  validate,
];

export const uuidValidation = [
  param('id').isUUID().withMessage('Valid UUID required'),
  validate,
];
