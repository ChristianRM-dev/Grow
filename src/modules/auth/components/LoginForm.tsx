"use client";

import { useActionState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  signInCommand,
  type SignInState,
} from "@/modules/auth/actions/signIn.command";
import {
  signInSchema,
  type SignInInput,
} from "@/modules/auth/domain/signIn.schema";

const initialState: SignInState = { ok: true };

export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);

  // React 19: useActionState
  const [state, formAction, isPending] = useActionState(
    signInCommand,
    initialState
  );

  const {
    register,
    trigger,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  async function handleClickSubmit() {
    const isValid = await trigger();
    if (isValid) formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3">
      {state.ok === false && state.message ? (
        <div className="alert alert-error">
          <span>{state.message}</span>
        </div>
      ) : null}

      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Correo electrónico</span>
        </div>
        <input
          type="email"
          className={`input input-bordered w-full ${
            errors.email ? "input-error" : ""
          }`}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email?.message ? (
          <div className="label">
            <span className="label-text-alt text-error">
              {errors.email.message}
            </span>
          </div>
        ) : null}
      </label>

      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Contraseña</span>
        </div>
        <input
          type="password"
          className={`input input-bordered w-full ${
            errors.password ? "input-error" : ""
          }`}
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password?.message ? (
          <div className="label">
            <span className="label-text-alt text-error">
              {errors.password.message}
            </span>
          </div>
        ) : null}
      </label>

      <button
        className="btn btn-primary w-full mt-2"
        type="button"
        onClick={handleClickSubmit}
        disabled={isPending}
      >
        {isPending ? "Ingresando..." : "Entrar"}
      </button>

      <button
        type="submit"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </form>
  );
}
