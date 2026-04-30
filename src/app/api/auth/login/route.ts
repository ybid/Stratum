import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
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

    // Find user
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const user = users[0];

    // Check password
    const hashedPassword = hashPassword(password);
    if (hashedPassword !== user.password_hash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    return NextResponse.json({ user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
