"use client";

import React, { useState, useTransition } from "react";
import { deleteUserAction, toggleUserStatusAction } from "@/actions/user-actions";
import { Trash2, AlertTriangle, X, Loader2, ShieldOff } from "lucide-react";
import { RoleType } from "@prisma/client";

interface DeleteUserModalProps {
  user: {
    id: string;
    name: string;
    email: string;
    roleType: RoleType;
    isActive: boolean;
  };
  isCurrentUser: boolean;
}

export function DeleteUserModal({ user, isCurrentUser }: DeleteUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isCurrentUser) {
    return (
      <span
        title="You cannot delete your own active Super Admin account"
        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 cursor-not-allowed opacity-40 px-2 py-1 font-medium"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Self</span>
      </span>
    );
  }

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error || "Failed to delete user account.");
      }
    });
  };

  const handleDeactivate = () => {
    setError(null);
    startTransition(async () => {
      const res = await toggleUserStatusAction(user.id, user.isActive);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error || "Failed to update account status.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/40 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/40 transition active:scale-95"
        title="Delete or deactivate staff account"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 text-left" dir="ltr">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-rose-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-rose-950/80 dark:bg-zinc-900 my-auto text-left" dir="ltr">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Delete Staff Account
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Super Admin Security Confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Action Prevented</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-bold text-zinc-900 dark:text-white">{user.name}</span>{" "}
                (<span className="font-mono text-zinc-500">{user.email}</span>)?
              </p>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">
                  Audit Trail Protection:
                </p>
                <p className="text-[11px] leading-relaxed">
                  If this staff member has logged shop expenses or recorded financial ledger entries, permanent deletion is safely blocked to protect accounting history. Deactivate their account instead to revoke login access instantly.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
              >
                Cancel
              </button>

              {user.isActive && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDeactivate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 transition"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  <span>Deactivate Instead</span>
                </button>
              )}

              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
