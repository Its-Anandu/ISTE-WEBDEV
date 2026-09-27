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

  return <RegistrationForm slug={slug} />;
}
