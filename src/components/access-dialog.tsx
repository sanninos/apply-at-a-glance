import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { AccessPanel } from '@/components/access-panel';
import { useAccess } from '@/components/access-provider';

const AccessDialogContext = createContext<{ open: () => void }>({ open: () => {} });
export const useAccessDialog = () => useContext(AccessDialogContext);

// Floating access component: any screen can call open() to show the sign-in
// form without leaving the page. /auth remains the full-screen callback route.
export function AccessDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, ready } = useAccess();
  useEffect(() => {
    if (open && ready && user) setOpen(false);
  }, [open, ready, user]);
  return <AccessDialogContext.Provider value={{ open: () => setOpen(true) }}>
    {children}
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerContent className="access-drawer">
        <DrawerTitle className="sr-only">Ingresar a URUJOBS</DrawerTitle>
        <AccessPanel onClose={() => setOpen(false)} embedded />
      </DrawerContent>
    </Drawer>
  </AccessDialogContext.Provider>;
}
