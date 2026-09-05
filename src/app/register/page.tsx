import { redirect } from 'next/navigation';

export const revalidate = 60;

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectUrl = params.redirect || '/shop';
  
  // Server-side redirect to login page with register mode
  redirect(`/login?mode=register&redirect=${encodeURIComponent(redirectUrl)}`);
}