export const DeleteButton: React.FC<{
  recordId: string;
  recordName: string;
}> = ({ recordId, recordName }) => {
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el registro "${recordName}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert(`El registro "${recordName}" ha sido eliminado.`);
        window.location.href = "/"; // Redirigir a la lista de registros
      } else {
        alert(
          "Hubo un error al eliminar el registro. Por favor, inténtalo de nuevo."
        );
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert(
        "Hubo un error al eliminar el registro. Por favor, inténtalo de nuevo."
      );
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="mt-4 w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Eliminar Registro
    </button>
  );
};
