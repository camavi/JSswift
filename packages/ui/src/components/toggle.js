
  UI.Toggle = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const behavior = String(props.behavior ?? props.mode ?? props.type ?? "checkbox").toLowerCase() === "radio"
      ? "radio"
      : "checkbox";
    return buildChoiceControl(behavior, args, {
      appearance: "toggle",
      modelName: "UI.Toggle:model"
    });
  };

  // Esempio: JSswift.ui.Toggle({ label: "Attivo", model: [get,set] })
