import React, { useState, useEffect } from 'react';
import { AccountSettingsPage } from '../../components/auth/AccountSettingsPage';
import { useRouter } from 'next/router';

export default function AccountSettings() {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch session on client side
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      console.log('No session token, redirecting to home');
      router.push('/');
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    })
      .then(res => {
        return res.ok ? res.json() : null;
      })
      .then(data => {
        if (data?.user) {
          setSession({ user: data.user });
        } else {
          console.log('No user data, redirecting to home');
          router.push('/');
        }
        setIsPending(false);
      })
      .catch((error) => {
        router.push('/');
        setIsPending(false);
      });
  }, [router]);

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update password');
    }

    return data;
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <AccountSettingsPage
      user={{
        id: session.user.id,
        username: session.user.username || 'User',
        createdAt: session.user.createdAt,
      }}
      onPasswordChange={handlePasswordChange}
    />
  );
}