import React from 'react';
import { Metadata } from 'next';
import RegistrationForm from './RegistrationForm';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const formattedTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `Register for ${formattedTitle} | ISTE SC MBCET`,
    description: `Official event registration form for ${formattedTitle} hosted by ISTE Student Chapter MBCET.`,
  };
}

export default async function EventRegistrationPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 selection:bg-amber-500 selection:text-white">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <RegistrationForm slug={slug} />
      </div>
    </main>
  );
}
