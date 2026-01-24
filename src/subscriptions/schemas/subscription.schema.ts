import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  userId!: string;

  @Prop({ default: 'active' })
  status!: 'active' | 'canceled';

  @Prop({ default: 'premium' })
  plan!: 'free' | 'premium';

  @Prop()
  currentPeriodEnd!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
