export const priorityColorPicker = ({ priority, style }) => {
  if (style === "gradient") {
    switch (priority) {
      case "Nula":
        return "from-stone-900";

      case "Baja":
        return "from-green-700";

      case "Media":
        return "from-yellow-500";

      case "Alta":
        return "from-orange-500";

      case "Urgente":
        return "from-red-600";

      case "Inactivo":
        return "from-stone-500";

      default:
        break;
    }
  } else if (style === "badge") {
    switch (priority) {
      case "Nula":
        return "bg-stone-900";

      case "Baja":
        return "bg-green-700";

      case "Media":
        return "bg-yellow-500";

      case "Alta":
        return "bg-orange-700";

      case "Urgente":
        return "bg-red-700 animate-ping";

      case "Inactivo":
        return "bg-stone-500";

      default:
        break;
    }
  }
};
