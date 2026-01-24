// auth.dto.ts
import * as Joi from 'joi';
import PasswordComplexity from 'joi-password-complexity';

// Register schema
export const  RegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: PasswordComplexity({
    min: 8,
    max: 30,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 3,
  }).required(),
  name: Joi.string().min(2).max(50).required(),
});

// Login schema
export const LoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});
