"use client";

import React, { useActionState, useState } from "react";
import { updateCustomerAction, deleteCustomerAction, CustomerActionResult } from "@/actions/customer-actions";
import { Edit2, Trash2, X, AlertCircle, Loader2, AlertTriangle, User } from "lucide-react";
import { AuthUser } from "@/lib/auth/session";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";
import { ImageUpload } from "@/components/ui/image-upload";

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  nidNumber: string | null;
  birthRegNumber: string | null;
  profilePhotoUrl?: string | null;
  profilePhotoKey?: string | null;
  address?: {
    street?: string | null;
    upazila?: string | null;
    district?: string | null;
    postalCode?: string | null;
  } | null;
  notes: string | null;
}

export function CustomerCardActions({
  customer,
  user,
}: {
  customer: CustomerData;
  user: AuthUser;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editState, editFormAction, isEditPending] = useActionState(
    async (prev: CustomerActionResult | null, formData: FormData) => {
      formData.set("customerId", customer.id);
      const res = await updateCustomerAction(prev, formData);
      if (res.success) {
        setIsEditOpen(false);
      }
      return res;
    },
    null
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteCustomerAction(customer.id);
    setIsDeleting(false);
    if (res.success) {
      setIsDeleteOpen(false);
    } else {
      setDeleteError(res.error || "Failed to delete customer.");
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <PermissionGate user={user} permission={Permission.CUSTOMERS_EDIT}>
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition active:scale-95"
            title="Edit Customer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </PermissionGate>

        <PermissionGate user={user} permission={Permission.CUSTOMERS_DELETE}>
          <button
            onClick={() => {
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition active:scale-95"
            title="Delete Customer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </PermissionGate>
      </div>

      {/* Edit Customer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-extrabold text-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Edit Customer Profile
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Update citizen details, NID or registration references
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editState?.error && (
              <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{editState.error}</span>
              </div>
            )}

            <form action={editFormAction} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Profile Photo Upload to Cloudflare R2 */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <ImageUpload
                  label="Citizen Profile Photo (Cloudflare R2)"
                  urlFieldName="profilePhotoUrl"
                  keyFieldName="profilePhotoKey"
                  initialUrl={customer.profilePhotoUrl}
                  initialKey={customer.profilePhotoKey}
                  folder="customers"
                  fallbackInitial={customer.name}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={customer.name}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={customer.phone}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    NID Number
                  </label>
                  <input
                    type="text"
                    name="nidNumber"
                    defaultValue={customer.nidNumber || ""}
                    placeholder="10 or 17 digit NID"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Birth Reg. No (BRIS)
                  </label>
                  <input
                    type="text"
                    name="birthRegNumber"
                    defaultValue={customer.birthRegNumber || ""}
                    placeholder="17 digit BRIS No"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={customer.email || ""}
                  placeholder="customer@gmail.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Address (Village / Road / Thana)
                </label>
                <input
                  type="text"
                  name="street"
                  defaultValue={customer.address?.street || ""}
                  placeholder="Street / Area"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                >
                  {isEditPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl sm:rounded-3xl border border-rose-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-rose-950/80 dark:bg-zinc-900 my-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
                  Delete Customer?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Permanent Action Confirmation
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-white">{customer.name}</span>? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
