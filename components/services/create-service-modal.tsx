"use client";

import React, { useActionState, useState } from "react";
import { createServiceAction, ServiceActionResult } from "@/actions/service-actions";
import { Plus, X, Trash2, Layers, AlertCircle, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface CustomField {
  fieldId: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  required: boolean;
  options: string[];
}

export function CreateServiceModal({ categories }: { categories: Category[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prev: ServiceActionResult | null, formData: FormData) => {
      formData.set("customFieldsJson", JSON.stringify(customFields));
      const res = await createServiceAction(prev, formData);
      if (res.success) {
        setIsOpen(false);
        setCustomFields([]);
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition"
      >
        <Plus className="h-4 w-4" />
        <span>Create New Service</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-extrabold text-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Create Dynamic Service
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Define citizen application, printing rate, or custom fields
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

            {state?.error && (
              <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. NID Correction Application"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Service Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. NID_CORR"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono uppercase outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition font-medium"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Shop Charge (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="baseCharge"
                    required
                    placeholder="100.00"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Govt Fee (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="govtFee"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Service Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Instructions for counter staff or customer prerequisites..."
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              {/* Dynamic Custom Fields Schema Builder */}
              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Dynamic Custom Fields (For Application Form)
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {customFields.length} configured
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
                  Add unique input fields required for this service (e.g. tracking slip number, applicant NID, appointment date).
                </p>

                {/* Field Creator Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Field Label (e.g., Application Slip No)"
                    className="flex-1 min-w-[150px] rounded-xl border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-750 dark:bg-zinc-900 dark:text-white"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="rounded-xl border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-750 dark:bg-zinc-900 dark:text-white font-medium"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded"
                    />
                    <span>Required</span>
                  </label>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition"
                  >
                    + Add Field
                  </button>
                </div>

                {/* List of Custom Fields */}
                {customFields.length > 0 && (
                  <div className="mt-3 space-y-1.5 divide-y divide-zinc-200/60 dark:divide-zinc-800">
                    {customFields.map((f, i) => (
                      <div key={i} className="flex items-center justify-between pt-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {f.label}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                            {f.fieldType}
                          </span>
                          {f.required && (
                            <span className="text-[10px] text-rose-500 font-bold">*required</span>
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

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
