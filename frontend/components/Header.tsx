"use client";

import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { LuUser as UserIcon } from "react-icons/lu";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const showHeader =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (!showHeader) return null;

  return (
    <header className="flex items-center justify-end gap-4 px-6 py-3 border-b">
      <Show when="signed-out">
        <SignInButton>
          <Button variant="outline">
            <UserIcon className="w-4 h-4" />
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button variant="outline">
            <UserIcon className="w-4 h-4" />
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  );
}
