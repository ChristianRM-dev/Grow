// src/app/(app)/sales-notes/new/sales-note-new-client.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { createSalesNoteAction } from "@/modules/sales-notes/actions/createSalesNote.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

const REQUEST_ID_KEY = "sales-note:new:clientRequestId";

function getOrCreateClientRequestId(): string {
  const existing = window.localStorage.getItem(REQUEST_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(REQUEST_ID_KEY, id);
  return id;
}

function clearClientRequestId() {
  window.localStorage.removeItem(REQUEST_ID_KEY);
}

export function SalesNoteNewClient({
  initialValues,
  sourceQuotation,
}: {
  initialValues: SalesNoteFormValues;
  sourceQuotation?: { id: string; folio: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Prevent double-submit before React state updates
  const submitLockRef = useRef(false);
  const clientRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    clientRequestIdRef.current = getOrCreateClientRequestId();
  }, []);

  const handleSubmit = async (values: SalesNoteFormValues) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    setSubmitting(true);
    try {
      const clientRequestId = clientRequestIdRef.current;
      if (!clientRequestId) {
        toast.error("No se pudo iniciar la creación. Intenta de nuevo.");
        return;
      }

      const res = await createSalesNoteAction({
        clientRequestId,
        values,
      });

      if (!res.ok) {
        toast.error("Revisa los campos. Hay errores de validación.");
        return;
      }

      toast.success("Guardado exitosamente");

      // ✅ Aquí se borra la requestId: solo en éxito
      clearClientRequestId();

      router.replace(routes.salesNotes.details(res.salesNoteId));
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <>
      {sourceQuotation ? (
        <div className="alert alert-info mb-4">
          <div>
            <h4 className="font-semibold">Cotización origen</h4>
            <p className="text-sm opacity-80">
              Prefill desde la cotización {sourceQuotation.folio}.
            </p>
          </div>
        </div>
      ) : null}

      <SalesNoteWizard
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  );
}
