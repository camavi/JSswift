# Forms

For a first page, read [AI quick start](../AI.md) alone. For product editing, use its CRUD route; this guide is for additional APIs.

Use _.useForm for values, validation, touched/dirty flags, and submissions. Bind fields through form.model("field").

    const form = _.useForm({ values: { email: "" } });
    _.Form({ form },
      _.Input({ label: "Email", model: form.model("email") }),
      _.Button({ type: "submit", color: "primary" }, "Save")
    );

Read each control document—Input, Select, Checkbox, Radio, Toggle, Slider, Rating, Date, and Time—because their value and model contracts differ.
