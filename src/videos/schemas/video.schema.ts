import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoDocument = Video & Document;

@Schema({ timestamps: true })
export class Video {
  @Prop()
  title?: string;

  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ default: 'pending' })
  status!: 'pending' | 'processing' | 'ready' | 'failed';

  @Prop({ default: 0 })
  duration!: number;

  @Prop()
  thumbnail?: string;

  @Prop({ type: [String] })
  segments!: string[];

  @Prop({ default: [] })
  qualities!: Array<{
    height: number;
    bitrate: number;
    segments: string[];
    playlist: string;
  }>;

  @Prop({ default: 0 })
  size!: number;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
