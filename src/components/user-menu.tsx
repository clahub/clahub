"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, LogOut, ScrollText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="bg-muted size-8 animate-pulse rounded-full" />
    );
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth/signin">Sign in</Link>
      </Button>
    );
  }

  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.nickname}
              width={32}
              height={32}
              className="size-8 rounded-full"
            />
          ) : (
            <User className="size-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.nickname}</span>
            {user.email && (
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "owner" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/agreements">
                <ScrollText className="mr-2 size-4" />
                My Agreements
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/api-keys">
                <KeyRound className="mr-2 size-4" />
                API Keys
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
