import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (password.length < 6 || password.length > 50) {
      return NextResponse.json({ error: 'Password must be 6-50 characters' }, { status: 400 });
    }

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = hashPassword(password);
    const userId = nanoid(10);

    // Create user
    await pool.query(
      'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [userId, username, hashedPassword]
    );

    return NextResponse.json({ user: { id: userId, username } });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
