import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional, because users can sign up with Google
  image: { type: String },
  bio: { type: String, default: "" },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingFollowers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastSearchQuery: { type: String, default: "General News" },
}, {
  timestamps: true,
});

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = model('User', UserSchema);

export default User;
