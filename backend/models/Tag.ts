import { Schema, model, type Document, type Model } from "mongoose";

export interface ITag extends Document {
  name: string;
  slug: string;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

const Tag: Model<ITag> = model<ITag>("Tag", tagSchema);

export default Tag;
