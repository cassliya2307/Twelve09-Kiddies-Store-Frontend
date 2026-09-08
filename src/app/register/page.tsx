import { redirect } from 'next/navigation';

function getSafeRedirect(raw: string | undefined): string {
  if (!raw) return '/shop';
  if (!raw.startsWith('/')) return '/shop';
  if (raw.startsWith('//')) return '/shop';
  if (raw.includes('://')) return '/shop';
  if (raw.includes('\\')) return '/shop';
  return raw;
}

export const revalidate = 60;

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectUrl = getSafeRedirect(params.redirect);
  
  // Server-side redirect to login page with register mode
  redirect(`/login?mode=register&redirect=${encodeURIComponent(redirectUrl)}`);
}