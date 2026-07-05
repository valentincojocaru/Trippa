/* Server layout for the /trip/[id] segment. Its only job is to give the
   static export a concrete param to pre-render: "active", the canonical
   entry the app always navigates through first. Real trip ids (localStorage
   timestamps) are never pre-rendered — the app is a client-side SPA inside
   Capacitor, so navigating to /trip/<id> renders the same page chunk on the
   client and useTrip() resolves the trip by id. No product logic changes. */

export function generateStaticParams() {
  return [{ id: "active" }];
}

export default function TripIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
