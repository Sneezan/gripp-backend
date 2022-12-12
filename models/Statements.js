import mongoose from 'mongoose'
export const StatementSchema = new mongoose.Schema({
    statementId: Number,
    statement: String,
    level: Number
  });