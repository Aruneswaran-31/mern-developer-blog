import mongoose, { Schema, model } from "mongoose";

interface ITag {
  name: string;
  slug: string;
}

const tagSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export default model<ITag>("Tag", tagSchema);