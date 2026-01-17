import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { ChangePasswordForm } from "@/modules/auth/components/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Cambiar contraseña",
  description: "Actualiza tu contraseña de acceso",
};

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(routes.login());
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl mb-4">Cambiar contraseña</h1>
          <p className="text-base-content/70 mb-6">
            Actualiza tu contraseña de acceso al sistema. Asegúrate de usar una
            contraseña segura que incluya letras, números y caracteres
            especiales.
          </p>

          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
