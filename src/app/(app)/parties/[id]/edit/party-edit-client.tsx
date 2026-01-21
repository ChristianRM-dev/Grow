// src/app/(app)/parties/[id]/edit/party-edit-client.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { PartyWizard } from "@/modules/parties/components/PartyWizard/PartyWizard";
import type { PartyFormValues } from "@/modules/parties/forms/partyForm.schemas";
import type { PartyEditDto } from "@/modules/parties/queries/getPartyById.query";
import { updatePartyAction } from "@/modules/parties/actions/updateParty.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function PartyEditClient({ party }: { party: PartyEditDto }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const initialValues: PartyFormValues = {
    name: party.name,
    phone: party.phone ?? "",
    notes: party.notes ?? "",
    roles: party.roles,
  };

  const handleSubmit = async (values: PartyFormValues) => {
    setSubmitting(true);
    try {
      await updatePartyAction({ id: party.id, values });
      toast.success("Actualizado exitosamente");
      router.replace(routes.parties.list());
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar el contacto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <PartyWizard
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
