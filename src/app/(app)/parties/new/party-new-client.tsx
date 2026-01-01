"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

import { PartyWizard } from "@/modules/parties/components/PartyWizard/PartyWizard";
import type { PartyFormValues } from "@/modules/parties/forms/partyForm.schemas";
import { createPartyAction } from "@/modules/parties/actions/createParty.action";

export function PartyNewClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: PartyFormValues) => {
    setSubmitting(true);
    try {
      await createPartyAction(values);
      toast.success("Guardado exitosamente");
      router.replace(routes.parties.list());
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar el contacto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <PartyWizard
        initialValues={{
          name: "",
          phone: "",
          notes: "",
          roles: { isCustomer: true, isSupplier: false },
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
