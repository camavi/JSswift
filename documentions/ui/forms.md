# Forms

Use JSswift.useForm for values, validation, touched/dirty flags, and submissions. Bind fields through form.model("field").

    const form = JSswift.useForm({ values: { email: "" } });
    JSswift.ui.Form({ form },
      JSswift.ui.Input({ label: "Email", model: form.model("email") }),
      JSswift.ui.Btn({ type: "submit", color: "primary" }, "Save")
    );

Read each control document—Input, Select, Checkbox, Radio, Toggle, Slider, Rating, Date, and Time—because their value and model contracts differ.
