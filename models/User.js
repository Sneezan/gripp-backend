import mongoose from 'mongoose'
import crypto from 'crypto'

export const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 18,
      unique: true,
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