import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, { metatype }: ArgumentMetadata) {
    if (!value) return value;

    if (!metatype) return value;

    const schema = Reflect.getMetadata('design:paramtypes', metatype)?.[0] || metatype;
    if (!schema) return value;

    const { error, value: validatedValue } = schema.validate(value, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestException(`Validation failed: ${error.message}`);
    }

    return validatedValue;
  }
}
