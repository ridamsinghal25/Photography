"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { useAppUser } from "@/contexts/UserContext";
import {
  LuUpload as UploadIcon,
  LuUsers as UsersIcon,
  LuHouse as HomeIcon,
} from "react-icons/lu";
import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { href: "/upload", label: "Upload", icon: UploadIcon },
  { href: "/subjects", label: "Subjects", icon: UsersIcon },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useAppUser();

  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname === "/";

  const showHeader =
    pathname === "/upload" ||
    pathname === "/subjects" ||
    isAuthPage ||
    /^\/[^/]+$/.test(pathname);

  if (!showHeader) return null;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b">
      <Show when="signed-in">
        <Link
          href={`/${user?.id}`}
          className="flex items-center justify-center size-8 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          title="Home"
        >
          <HomeIcon className="w-4 h-4" />
        </Link>
        <nav className="flex items-center gap-1 pr-3 ml-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                (pathname === href
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-800 hover:text-zinc-900 hover:bg-zinc-50")
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <UserButton />
      </Show>

      <Show when="signed-out">
        {isAuthPage && (
          <div className="flex items-center gap-2 ml-auto">
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: "sm" }) + " bg-indigo-600 hover:bg-indigo-500 text-white border-0"}>
              Sign up
            </Link>
          </div>
        )}
      </Show>
    </header>
  );
}
