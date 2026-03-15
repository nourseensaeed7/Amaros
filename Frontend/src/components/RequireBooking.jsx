import { useLocation, Navigate } from "react-router-dom";

export default function RequireBooking({ children }) {
  const location = useLocation();

  // Only allow access if navigated here with a reservationId
  // Otherwise redirect back to vans page so they can pick a van first
  if (!location.state?.reservationId) {
    return <Navigate to="/vans" replace />;
  }

  return children;
}