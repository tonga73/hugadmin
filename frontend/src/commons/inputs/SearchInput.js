import React, { useState, useEffect } from "react";

export function SearchInput() {
  const [enteredText, setEnteredText] = useState("");
  const keyUpHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = document.getElementById("search-bar");
    if (event.code === "Enter" && event.ctrlKey) {
      input.focus();
    } else if (event.code === "Escape") {
      input.value = "";
      input.blur();
    }
  };

  // Add event listeners
  useEffect(() => {
    window.addEventListener("keyup", keyUpHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keyup", keyUpHandler);
    };
  }, []);
  return (
    <input
      id="search-bar"
      onKeyDown={keyUpHandler}
      className="text-xl py-1.5 px-1 dark:text-slate-200 dark:bg-slate-800"
      placeholder="Buscar..."
      type="search"
    />
  );
}
