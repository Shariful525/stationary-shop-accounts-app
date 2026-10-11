"use client";

import React, { useActionState, useState } from "react";
import { updateServiceAction, deleteServiceAction, ServiceActionResult } from "@/actions/service-actions";
import { Edit2, Trash2, X, Plus, AlertCircle, Loader2 } from "lucide-react";
import { AuthUser } from "@/lib/auth/session";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";

interface Category {
  id: string;
  name: string;
}

interface CustomField {
  fieldId: string;
  label: string;
  fieldType: string;
  placeholder?: string | null;
  required: boolean;
  options: string[];
}

interface ServiceData {
  id: string;
  name: string;
  code: string;
  categoryId: string | null;
  baseCharge: number;
  govtFee: number;
  costPrice: number;
  description: string | null;
  customFields: CustomField[];
}

export function ServiceCardActions({
  service,
  categories,
  user,
}: {
  service: ServiceData;
  categories: Category[];
  user: AuthUser;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [customFields, setCustomFields] = useState<CustomField[]>(service.customFields || []);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const [editState, editFormAction, isEditPending] = useActionState(
    async (prev: ServiceActionResult | null, formData: FormData) => {
      formData.set("serviceId", service.id);
      formData.set("customFieldsJson", JSON.stringify(customFields));
      const res = await updateServiceAction(prev, formData);
      if (res.success) {
        setIsEditOpen(false);
      }
      return res;
    },
    null
  );

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const fieldId = newFieldLabel.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    setCustomFields([
      ...customFields,
      {
        fieldId,
        label: newFieldLabel.trim(),
        fieldType: newFieldType,
        required: newFieldRequired,
        options: [],
      },
    ]);
    setNewFieldLabel("");
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteServiceAction(service.id);
    setIsDeleting(false);
    if (res.success) {
      setIsDeleteOpen(false);
    } else {
      setDeleteError(res.error || "Failed to delete service.");
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <PermissionGate user={user} permission={Permission.SERVICES_EDIT}>
          <button
            onClick={() => {
              setCustomFields(service.customFields || []);
              setIsEditOpen(true);
            }}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition"
            title="Edit Service"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </PermissionGate>

        <PermissionGate user={user} permission={Permission.SERVICES_DELETE}>
          <button
            onClick={() => {
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
            title="Delete Service"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </PermissionGate>
      </div>

      {/* Edit Service Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Edit Service: {service.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Update pricing, dynamic schema fields, or instructions
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form action={editFormAction} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {editState?.error && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{editState.error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={service.name}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Unique Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      required
                      defaultValue={service.code}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-mono uppercase text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={service.categoryId || ""}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fee Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Shop Charge (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="baseCharge"
                      required
                      defaultValue={service.baseCharge}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Govt Fee (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="govtFee"
                      defaultValue={service.govtFee}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Consumable Cost (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      defaultValue={service.costPrice}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Description / Instructions
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={service.description || ""}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                  />
                </div>

                {/* Dynamic Custom Fields Schema Builder */}
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Dynamic Custom Fields (For Customer Orders)
                    </h4>
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {customFields.length} configured
                    </span>
                  </div>

                  {/* Field Creator Bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Field Label (e.g. Tracking ID)"
                      className="flex-1 min-w-[140px] rounded-xl border border-zinc-200 bg-white p-2 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white p-2 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="textarea">Textarea</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      />
                      <span>Required</span>
                    </label>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Field
                    </button>
                  </div>

                  {/* List of Custom Fields */}
                  {customFields.length > 0 && (
                    <div className="space-y-1.5 divide-y divide-zinc-200 dark:divide-zinc-800">
                      {customFields.map((f, i) => (
                        <div key={i} className="flex items-center justify-between pt-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {f.label}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {f.fieldType}
                            </span>
                            {f.required && (
                              <span className="text-[10px] text-rose-500 font-semibold">*required</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomField(i)}
                            className="text-zinc-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Delete Service?
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-zinc-200">{service.name}</span>? Existing orders referencing this service will remain preserved in logs, but no new orders can be created.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
