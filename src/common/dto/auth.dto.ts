import * as Joi from 'joi';

// Register schema
export const RegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('(?=.*[a-z])')) // at least one lowercase
    .pattern(new RegExp('(?=.*[A-Z])')) // at least one uppercase
    .pattern(new RegExp('(?=.*[0-9])')) // at least one number
    .pattern(new RegExp('(?=.*[!@#$%^&*])')) // at least one special char
    .required(),
  name: Joi.string().min(2).max(50).optional(),
});

// Login schema
export const LoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});
