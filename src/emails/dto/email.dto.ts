import * as Joi from 'joi';

export class SendEmailDto {
  static schema = Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().max(200).required(),
    template: Joi.string().valid('subscription', 'video-ready', 'welcome').required(),
    context: Joi.object().required(),
  });
}
