import mongoose from 'mongoose';

const recruiterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const reportSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  username: { type: String, required: true },
  score: Number,
  role: String,
  data: Object,
  createdAt: { type: Date, default: Date.now },
});

export const Recruiter = mongoose.model('Recruiter', recruiterSchema);
export const Report = mongoose.model('Report', reportSchema);