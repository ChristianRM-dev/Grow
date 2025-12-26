import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/modules/auth/components/LoginForm";
import { routes } from "@/lib/routes";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect(routes.dashboard());

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h1 className="card-title text-2xl">Iniciar sesión</h1>
        <p className="opacity-80">Ingresa tus credenciales para continuar.</p>
        <LoginForm />
      </div>
    </div>
  );
}
