import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserProfileModel } from '../models/UserProfile';
import { isDatabaseConnected } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'goodscheme_secret_2026';

/**
 * Auth Controller
 * Citizen Registration, Mobile/Email Login, and Profile Management
 */
export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      if (!isDatabaseConnected()) {
        res.status(503).json({ success: false, message: 'Registration is unavailable right now (database offline). Use demo sign-in instead.' });
        return;
      }

      const { fullName, email, mobile, password, age, gender, state, occupation, annualIncome, category } = req.body;

      let passwordHash = undefined;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const newUser = new UserProfileModel({
        fullName: fullName || 'Citizen User',
        email,
        mobile,
        passwordHash,
        age: age ?? 25,
        gender: gender || 'All',
        state: state || 'All India',
        occupation: occupation || 'General Citizen',
        annualIncome: annualIncome ?? 250000,
        category: category || 'General'
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        success: true,
        message: 'Citizen registration successful',
        token,
        user: newUser
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Registration failed' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, mobile, password } = req.body;

      const user = isDatabaseConnected()
        ? await UserProfileModel.findOne({
            $or: [{ email: email || 'never_match' }, { mobile: mobile || 'never_match' }]
          })
        : null;

      if (!user) {
        // Return demo token for seamless hackathon UX
        const mockUser = {
          id: 'demo-user-123',
          fullName: 'Citizen Demo User',
          age: 28,
          state: 'Uttar Pradesh',
          occupation: 'Farmer'
        };
        const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ success: true, message: 'Demo citizen login successful', token, user: mockUser });
        return;
      }

      if (user.passwordHash) {
        const isMatch = password ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!isMatch) {
          res.status(401).json({ success: false, message: 'Invalid credentials' });
          return;
        }
      }

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Login failed', error });
    }
  }
}
