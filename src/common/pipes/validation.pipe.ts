import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, { metatype }: ArgumentMetadata) {
    if (!value) return value;

    const paramTypes = metatype
      ? Reflect.getMetadata('design:paramtypes', metatype)
      : undefined;
    const schemaCandidate = paramTypes?.[0] || metatype;
    if (!schemaCandidate) return value;

    // Determine a Joi schema to use. Support three cases:
    // 1) schemaCandidate is already a Joi schema (has validate)
    // 2) schemaCandidate is a class that exposes a static `schema` property (e.g. DTO classes)
    // 3) otherwise skip validation (e.g. interfaces or plain objects)
    let joiSchema: any = undefined;
    if (
      schemaCandidate &&
      typeof (schemaCandidate as any).validate === 'function'
    ) {
      joiSchema = schemaCandidate;
    } else if (
      schemaCandidate &&
      (schemaCandidate as any).schema &&
      typeof (schemaCandidate as any).schema.validate === 'function'
    ) {
      joiSchema = (schemaCandidate as any).schema;
    }

    if (!joiSchema) {
      // Nothing we can validate with Joi — skip and return original value
      return value;
    }

    const { error, value: validatedValue } = joiSchema.validate(value, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestException(`Validation failed: ${error.message}`);
    }

    return validatedValue;
  }
}
