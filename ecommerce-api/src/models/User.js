import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,      
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isActive: {
      type: Boolean,
      default: true
    },

    email_verified: { type: Boolean, default: false },
    last_login: Date,    
  },
  {timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;