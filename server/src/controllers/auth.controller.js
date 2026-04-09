import { validationResult } from 'express-validator';
import * as authService from '../services/auth.service.js';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, email, password, city, phone } = req.body;
    const { user, accessToken, refreshToken } = await authService.register({ name, email, password, city, phone });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login({ email, password });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { accessToken, refreshToken: newRefresh } = await authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', newRefresh, COOKIE_OPTS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { token } = req.params;
    const { password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}
