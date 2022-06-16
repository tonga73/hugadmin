export const statusColorPicker = ({ status }) => {
  switch (status) {
    case "Acepta cargo":
      return "bg-stone-900";

    case "Acto pericial realizado":
      return "bg-green-900";

    case "Pericia realizada":
      return "bg-blue-500";

    case "Sentencia o convenio de partes":
      return "bg-blue-900";

    case "Honorarios regulados":
      return "bg-yellow-700";

    case "En tratativa de cobro":
      return "bg-purple-500";

    case "Cobrado":
      return "bg-purple-700";

    default:
      break;
  }
};
