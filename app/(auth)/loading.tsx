import { FaSpinner } from "react-icons/fa";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3">
      <FaSpinner className="animate-spin" />
      <span className="animate-pulse">Cargando...</span>
    </div>
  );
}
