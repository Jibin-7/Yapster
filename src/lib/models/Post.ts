import mongoose, { Schema, model, models } from 'mongoose';

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String }, // Optional image for the post
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
}, {
  timestamps: true,
});

if (mongoose.models.Post) {
  delete mongoose.models.Post;
}

const Post = model('Post', PostSchema);

export default Post;
