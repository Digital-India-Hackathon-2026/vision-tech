import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Recruiter } from './model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'githire-dev-secret-key-change-in-production';

export async function signup(email, password, name) {
  const existing = await Recruiter.findOne({ email });
  if (existing) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const recruiter = await Recruiter.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: recruiter._id, email: recruiter.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return { token, user: { id: recruiter._id, name: recruiter.name, email: recruiter.email } };
}

export async function login(email, password) {
  const recruiter = await Recruiter.findOne({ email });
  if (!recruiter) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, recruiter.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ id: recruiter._id, email: recruiter.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return { token, user: { id: recruiter._id, name: recruiter.name, email: recruiter.email } };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}