import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isAdminEmail } from '@/lib/isAdmin';
import { getAllRegistrations } from '@/lib/googleSheets';
import AdminTableClient from './AdminTableClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | ISTE Event Registrations',
  description: 'Manage and verify event registrations for ISTE SC MBCET.',
};

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/admin/login');
  }

  const registrations = await getAllRegistrations();

  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-zinc-100 font-sans selection:bg-amber-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminTableClient
          initialRegistrations={registrations}
          adminEmail={user.email!}
        />
      </div>
    </main>
  );
}
