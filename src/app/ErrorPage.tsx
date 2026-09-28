import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} · ${error.statusText}` : 'Page not found';
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-6xl">🧭</p>
        <h1 className="mt-4 text-2xl font-bold">{message}</h1>
        <Link to="/" className="mt-4 inline-block text-violet-500 underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
