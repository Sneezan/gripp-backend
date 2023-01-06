import mongoose from 'mongoose'
import crypto from 'crypto'

export const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
    username: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 18,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    // npm install crypto
    accessToken: {
      type: String,
      default: () => crypto.randomBytes(128).toString("hex")
    },
    userCreatedAt: {
      type: Date,
      default: () => new Date()
    }
  });