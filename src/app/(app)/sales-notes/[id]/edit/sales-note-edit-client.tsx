"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import type { SalesNoteForEditDto } from "@/modules/sales-notes/queries/getSalesNoteForEdit.query";
import { updateSalesNoteAction } from "@/modules/sales-notes/actions/updateSalesNote.action";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function SalesNoteEditClient({
  salesNote,
}: {
  salesNote: SalesNoteForEditDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // Lifecycle logging
  useEffect(() => {
    salesNoteLogger.info("SalesNoteEditClient", "Component mounted", {
      salesNoteId: salesNote.id,
      linesCount: salesNote.values.lines?.length ?? 0,
      unregisteredLinesCount: salesNote.values.unregisteredLines?.length ?? 0,
      customerMode: salesNote.values.customer?.mode,
    });
    return () => {
      salesNoteLogger.info("SalesNoteEditClient", "Component unmounting");
    };
  }, []);

  const handleSubmit = async (values: SalesNoteFormValues) => {
    salesNoteLogger.info("SalesNoteEditClient", "handleSubmit called", {
      salesNoteId: salesNote.id,
      submitting,
      locked: submitLockRef.current,
      linesCount: values.lines?.length ?? 0,
      unregisteredLinesCount: values.unregisteredLines?.length ?? 0,
      customerMode: values.customer?.mode,
    });

    if (submitLockRef.current) {
      salesNoteLogger.warn("SalesNoteEditClient", "Submit blocked by lock");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);

    try {
      salesNoteLogger.info("SalesNoteEditClient", "Calling updateSalesNoteAction", {
        salesNoteId: salesNote.id,
      });
      const t0 = performance.now();
      const res = await updateSalesNoteAction({ id: salesNote.id, values });
      const elapsedMs = Math.round(performance.now() - t0);

      salesNoteLogger.info("SalesNoteEditClient", "updateSalesNoteAction resolved", {
        elapsedMs,
        ok: (res as any).ok,
        traceId: (res as any).traceId,
      });

      if (!(res as any).ok) {
        salesNoteLogger.warn("SalesNoteEditClient", "Update returned error", {
          traceId: (res as any).traceId,
        });
        toast.error("No se pudo actualizar la nota de venta");
        return;
      }

      toast.success("Actualizado exitosamente");

      const targetUrl = routes.salesNotes.details(salesNote.id);
      salesNoteLogger.info("SalesNoteEditClient", "Navigating after successful update", {
        targetUrl,
      });
      router.replace(targetUrl);
      router.refresh();
      salesNoteLogger.info("SalesNoteEditClient", "router.replace + router.refresh invoked");
    } catch (err) {
      salesNoteLogger.error("SalesNoteEditClient", "Exception in handleSubmit", err);
      console.error(err);
      toast.error("No se pudo actualizar la nota de venta");
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
      salesNoteLogger.info("SalesNoteEditClient", "Submit finished, state reset");
    }
  };

  return (
    <div className="p-4">
      <SalesNoteWizard
        initialValues={salesNote.values}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
