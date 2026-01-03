export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-52" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-56" />
            <div className="skeleton h-56 w-full" />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-56" />
            <div className="skeleton h-56 w-full" />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-56" />
            <div className="skeleton h-56 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
