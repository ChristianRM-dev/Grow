"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/modules/auth/domain/changePassword.schema";

export type ChangePasswordState = {
  ok: boolean;
  message?: string;
};

export async function changePasswordCommand(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  // 1. Validate session
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Sesión no válida. Por favor inicia sesión nuevamente.",
    };
  }

  // 2. Validate input
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    // 3. Fetch current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return {
        ok: false,
        message: "Usuario no encontrado o inactivo.",
      };
    }

    if (!user.passwordHash) {
      return {
        ok: false,
        message: "Este usuario no tiene contraseña configurada.",
      };
    }

    // 4. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return {
        ok: false,
        message: "La contraseña actual es incorrecta.",
      };
    }

    // 5. Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // 6. Revalidate relevant paths
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Contraseña actualizada exitosamente.",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      ok: false,
      message: "Error al cambiar la contraseña. Intenta nuevamente.",
    };
  }
}
