import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';

@Schema({ timestamps: true, collection: 'users' , versionKey: false})
export class UserDocument extends Document {
  declare _id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  username: string;

  @Prop({ type: String, required: false })
  fullName?: string;

  @Prop({
    type: String,
    required: true,
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
