import { cookies } from 'next/headers';
import { auth } from '../(auth)/auth';
import { ClientWrapper } from '@/components/ClientWrapper';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <ClientWrapper 
      session={session}
      isCollapsed={isCollapsed}
    >
      {children}
    </ClientWrapper>
  );
}