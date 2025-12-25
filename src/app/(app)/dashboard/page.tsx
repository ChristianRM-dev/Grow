export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        <h1>Inicio</h1>
        <p className="opacity-80">
          Esta es una pantalla privada de prueba. Más adelante mostraremos
          información de sesión cuando integremos autenticación.
        </p>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Estado</h2>
          <div className="flex flex-wrap gap-2">
            <div className="badge badge-success badge-outline">
              Layout privado activo
            </div>
            <div className="badge badge-outline">Sin guard</div>
            <div className="badge badge-outline">Sin Auth</div>
          </div>
        </div>
      </div>
    </div>
  );
}
