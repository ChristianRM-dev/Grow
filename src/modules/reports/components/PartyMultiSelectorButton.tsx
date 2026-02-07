"use client"

interface PartyMultiSelectorButtonProps {
  selectedCount: number
  mode: "include" | "exclude" | null
  label: string
  onClick: () => void
}

export function PartyMultiSelectorButton({
  selectedCount,
  mode,
  label,
  onClick,
}: PartyMultiSelectorButtonProps) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>

      <button
        type="button"
        className="btn btn-outline w-full justify-between gap-3 h-auto min-h-[3rem] py-3"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>

          {/* Text */}
          <div className="flex-1">
            {selectedCount === 0 ? (
              <span className="opacity-70">Haz clic para seleccionar…</span>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {selectedCount}{" "}
                  {selectedCount === 1 ? "registro" : "registros"}
                </span>
                <span className="text-xs opacity-70">
                  {mode === "include"
                    ? "Incluir solo estos registros"
                    : "Excluir estos registros"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badge + Arrow */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 ? (
            <span
              className={`badge ${
                mode === "include" ? "badge-primary" : "badge-error"
              }`}
            >
              {selectedCount}
            </span>
          ) : null}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>
    </div>
  )
}
