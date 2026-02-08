"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-8 w-8 rounded-full"
          />
        )}
        <Button onClick={() => signOut()} variant="outline" size="sm">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("google")} size="sm">
      Sign in
    </Button>
  );
}
