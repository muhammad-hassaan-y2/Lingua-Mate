'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { Grid, Settings } from 'lucide-react';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';

export function ChatHeader() {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  return (
    <div className="flex flex-col">
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <SidebarToggle />
        <span className="font-medium ml-2">Chatbot</span>
        <div className="flex gap-2 ml-auto">
          <BetterTooltip content="Grid View">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Grid className="h-5 w-5" />
            </Button>
          </BetterTooltip>
          <BetterTooltip content="Settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
          </BetterTooltip>
        </div>
      </header>
      
      {(!open || windowWidth < 768) && (
        <div className="flex justify-center py-2">
          <BetterTooltip content="New Chat">
            <Button
              variant="outline"
              className="px-4"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span>New Chat</span>
            </Button>
          </BetterTooltip>
        </div>
      )}
    </div>
  );
}