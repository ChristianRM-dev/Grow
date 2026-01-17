"use client";

import { useActionState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  changePasswordCommand,
  type ChangePasswordState,
} from "@/modules/auth/actions/changePassword.command";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/modules/auth/domain/changePassword.schema";

const initialState: ChangePasswordState = { ok: true };

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    changePasswordCommand,
    initialState,
  );

  const {
    register,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  // Reset form on successful password change
  useEffect(() => {
    if (state.ok && state.message) {
      reset();
    }
  }, [state, reset]);

  async function handleClickSubmit() {
    const isValid = await trigger();
    if (isValid) formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {/* Success message */}
      {state.ok && state.message ? (
        <div className="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{state.message}</span>
        </div>
      ) : null}

      {/* Error message */}
      {state.ok === false && state.message ? (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{state.message}</span>
        </div>
      ) : null}

      {/* Current password */}
      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Contraseña actual</span>
        </div>
        <input
          type="password"
          className={`input input-bordered w-full ${
            errors.currentPassword ? "input-error" : ""
          }`}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isPending}
          {...register("currentPassword")}
        />
        {errors.currentPassword?.message ? (
          <div className="label">
            <span className="label-text-alt text-error">
              {errors.currentPassword.message}
            </span>
          </div>
        ) : null}
      </label>

      {/* New password */}
      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Nueva contraseña</span>
        </div>
        <input
          type="password"
          className={`input input-bordered w-full ${
            errors.newPassword ? "input-error" : ""
          }`}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
          {...register("newPassword")}
        />
        {errors.newPassword?.message ? (
          <div className="label">
            <span className="label-text-alt text-error">
              {errors.newPassword.message}
            </span>
          </div>
        ) : null}
      </label>

      {/* Confirm password */}
      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Confirmar nueva contraseña</span>
        </div>
        <input
          type="password"
          className={`input input-bordered w-full ${
            errors.confirmPassword ? "input-error" : ""
          }`}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword?.message ? (
          <div className="label">
            <span className="label-text-alt text-error">
              {errors.confirmPassword.message}
            </span>
          </div>
        ) : null}
      </label>

      {/* Submit button */}
      <button
        className="btn btn-primary w-full"
        type="button"
        onClick={handleClickSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <span className="loading loading-spinner"></span>
            Actualizando...
          </>
        ) : (
          "Cambiar contraseña"
        )}
      </button>

      {/* Hidden submit for form submission */}
      <button
        type="submit"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </form>
  );
}
