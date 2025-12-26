import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect(routes.dashboard());
  }

  redirect(routes.login());
}
