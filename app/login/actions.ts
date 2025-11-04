'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Helper to get the base URL for server-side requests
function getBaseURL() {
  // Check if we're on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // For local development
  return process.env.BETTER_AUTH_URL || 'http://localhost:3000';
}

type CookieOptions = {
  path?: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
};

function parseCookieString(cookieString: string): { name: string; value: string; options: CookieOptions } | null {
  const [nameValue, ...attributes] = cookieString.split(';');
  const [name, value] = nameValue.split('=');

  if (!name || !value) {
    return null;
  }

  const options: CookieOptions = { path: '/' };

  for (const attr of attributes) {
    const trimmedAttr = attr.trim().toLowerCase();
    if (trimmedAttr.startsWith('max-age=')) {
      options.maxAge = parseInt(trimmedAttr.split('=')[1]);
    } else if (trimmedAttr.startsWith('path=')) {
      options.path = trimmedAttr.split('=')[1];
    } else if (trimmedAttr === 'secure') {
      options.secure = true;
    } else if (trimmedAttr === 'httponly') {
      options.httpOnly = true;
    } else if (trimmedAttr.startsWith('samesite=')) {
      const sameSiteValue = trimmedAttr.split('=')[1];
      if (sameSiteValue === 'strict' || sameSiteValue === 'lax' || sameSiteValue === 'none') {
        options.sameSite = sameSiteValue;
      }
    }
  }

  return {
    name: name.trim(),
    value: decodeURIComponent(value.trim()),
    options,
  };
}

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Email and password are required'));
  }

  try {
    const baseURL = getBaseURL();
    const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Invalid email or password' }));
      redirect('/login?error=' + encodeURIComponent(error.message || 'Invalid email or password'));
    }

    // Extract cookies from response and set them
    const setCookieHeaders = response.headers.getSetCookie();
    const cookieStore = await cookies();

    for (const cookieString of setCookieHeaders) {
      const parsed = parseCookieString(cookieString);
      if (parsed) {
        cookieStore.set(parsed.name, parsed.value, parsed.options);
      }
    }
  } catch (error) {
    console.error('Sign in error:', error);
    redirect('/login?error=' + encodeURIComponent('Invalid email or password'));
  }

  redirect('/');
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !name) {
    redirect('/login?mode=signup&error=' + encodeURIComponent('All fields are required'));
  }

  try {
    const baseURL = getBaseURL();
    const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Failed to create account. Email may already be in use.' }));
      redirect(
        '/login?mode=signup&error=' +
          encodeURIComponent(error.message || 'Failed to create account. Email may already be in use.'),
      );
    }

    // Extract cookies from response and set them
    const setCookieHeaders = response.headers.getSetCookie();
    const cookieStore = await cookies();

    for (const cookieString of setCookieHeaders) {
      const parsed = parseCookieString(cookieString);
      if (parsed) {
        cookieStore.set(parsed.name, parsed.value, parsed.options);
      }
    }
  } catch (error) {
    console.error('Sign up error:', error);
    redirect(
      '/login?mode=signup&error=' +
        encodeURIComponent('Failed to create account. Email may already be in use.'),
    );
  }

  redirect('/');
}
