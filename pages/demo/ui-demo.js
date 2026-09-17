JSswift.ready(() => {
  const root = document.getElementById("ui-playground");
  if (!root || typeof _.Card !== "function") return;
  const t = (key, replacements = {}) =>
    window.JSswiftDemoI18n?.t(`playground.ui.${key}`, replacements) ?? key;

  const nameModel = _.rod("Carlos");
  const bioModel = _.rod("Frontend JSswift");
  const roleModel = _.rod("developer");
  const searchModel = _.rod("");
  const dateModel = _.rod("");
  const calendarModel = _.rod("");
  const buttonLoading = _.rod(false);
  // Reproduction: controls are created inside a dynamic child. Their model
  // bindings read these rods while the parent effect is collecting dependencies.
  // Updating either model therefore recreates the whole subtree.
  const bugNameModel = _.rod("Carlos");
  const bugRoleModel = _.rod("");
  const bugRoleTextareaModel = _.rod("developer");
  const bugRenderTick = _.rod(0);
  const uploadEvents = _.rod([]);
  const addUploadEvent = (text) => {
    uploadEvents.value = [text, ...uploadEvents.value].slice(0, 6);
  };
  const demoUploader = async (file, { progress }) => {
    for (const value of [18, 42, 68, 91, 100]) {
      await new Promise((resolve) => setTimeout(resolve, 140));
      progress(value);
    }
    return { ok: true, name: file.name };
  };
  const demoSave = async () => new Promise((resolve) => setTimeout(resolve, 900));
  const searchItems = [
    { title: "Dashboard", description: "Panoramica e metriche principali", value: "dashboard" },
    { title: "Utenti", description: "Gestione account e ruoli", value: "users" },
    { title: "Componenti UI", description: "Catalogo dei componenti JSswift", value: "ui-components" },
    { title: "Impostazioni", description: "Preferenze e configurazione", value: "settings" },
  ];
  const [getUpdates, setUpdates] = _.signal(true);
  const Themes = _.rod(_.getTheme() === "dark");
  Themes.action((v) => {
    _.setTheme(v ? "dark" : "light");
  });
  function testBug() {
    return _.div({ class: "cms-text-center" },
      _.div({
        
      }, _.Select({
        label: "Role (click to reproduce the immediate close)",
        model: bugRoleModel,
        options: [{ value: "", label: "Empty option" }, { value: "developer", label: "Developer" }, { value: "designer", label: "Designer" }, { value: "operator", label: "Operator" }],
        //color: "success",
      })),
      _.Input({
        label: "Name (type here)",
        model: bugNameModel,
      }),
      _.Textarea({
        label: "Name (type here)",
        model: bugRoleTextareaModel,
      }),
    );
  }
  _.mount(
    root,
    _.div(
      _.Card(
        _.cardBody(
          _.Row(
            _.Spacer(),
            _.div({ class: "cms-text-right" },
              _.Toggle({ color: "success", model: Themes, uncheckedIcon: "light_mode", checkedIcon: "brightness_6", }, () => Themes.value ? "Theme dark" : "Theme light"),
            )
          ),
          _.Input({
            label: t("nameLabel"),
            model: nameModel,
            clearable: true,
          }),
          _.Textarea({
            placeholder: "Bio",
            model: bioModel,
            rows: 3,
            clearable: true,
          }),
          _.Select({
            label: t("roleLabel"),
            model: roleModel,
            options: ["developer", "designer", "operator"],
            icon: "account_box",
          }),
          _.Slider({
            label: "Slider",
            model: roleModel,
            min: 0,
            max: 100,
            step: 10,
            size: "xs",
          }),
          _.Search({
            label: "Search",
            model: searchModel,
            items: searchItems,
            getLabel: item => item.title,
            getValue: item => item.value,
            clearable: true,
            minLength: 0,
            shortcode: "cmd+k",
            placeholder: "Cerca pagine...",
          }),
          _.Checkbox({ model: [getUpdates, setUpdates] }, t("updatesLabel")),
          _.input({ placeholder: 'prova', name: "test" }),
          _.Input({ placeholder: 'prova', name: "test", iconRight: _.Icon({name:'search', tooltip:"Cerca"}) }),
          _.Datepicker({ model: dateModel, mode: "range", label: t("updatesLabel") }),
          _.Calendar({ model: calendarModel, size: "sm" }),
          _.h3("Upload"),
          _.Upload({
            title: "Document upload",
            subtitle: "Drop TXT, PDF or images. Max 3 files, 2 MB each.",
            accept: ".txt,.pdf,image/*",
            maxFiles: 3,
            maxFileSize: 2 * 1024 * 1024,
            parallelUploads: 2,
            autoUpload: false,
            clickable: false,
            uploadButton: false,
            upload: demoUploader,
            onAdded: (item) => addUploadEvent(`Added ${item.name}`),
            onRejected: (item, ctx) => addUploadEvent(`Rejected ${item.name}: ${ctx.reason}`),
            onSuccess: (item) => addUploadEvent(`Uploaded ${item.name}`),
            onError: (item) => addUploadEvent(`Error ${item.name}`),
            onCancel: (item) => addUploadEvent(`Canceled ${item.name}`),
            slots: {
              empty: "Drop files or use Browse",
              fileMeta: ({ item }) => {
                if (item.status === "done") return "Ready on demo server";
                if (item.status === "queued") return "Waiting in queue";
                if (item.status === "uploading") return `Uploading ${item.progress}%`;
                if (item.status === "rejected") return `Rejected: ${item.error}`;
                if (item.status === "error") return `Failed: ${item.error?.message || item.error}`;
                return item.status;
              },
            },
          }),
          _.BoxUpload({
            title: "BoxUpload manuscript",
            subtitle: "Styled drop area for the manuscript flow.",
            accept: ".doc,.docx,.pdf,.txt",
            maxFiles: 1,
            autoUpload: false,
            clickable: false,
            upload: demoUploader,
            browseText: "Choose manuscript",
            uploadText: "Send",
            clearText: "Reset",
            onAdded: (item) => addUploadEvent(`Box added ${item.name}`),
            onSuccess: (item) => addUploadEvent(`Box uploaded ${item.name}`),
            onRejected: (item, ctx) => addUploadEvent(`Box rejected ${item.name}: ${ctx.reason}`),
          }),
          _.div(
            _.Btn({
              label: "Salva",
              loading: buttonLoading,
              class: "cms-m-r-sm",
              loadingSize: 16,
              color: "primary",
              onClick: async () => {
                buttonLoading.value = true;
                await demoSave();
                buttonLoading.value = false;
              }
            }),
            _.Btn({
              label: "Salva",
              loading: true,
              loadingSize: 16,
              color: "primary",
            })
          ),
          _.div(

            _.Btn(
              {
                color: "secondary",
                outline: true,
                onClick: () => _.Notify?.success?.(t("actionToast")),
              },
              t("actionButton"),
            ),
            _.Chip({ color: "info", outline: true }, () => t("roleChip", { value: roleModel.value })),
            _.Badge({ color: "success" }, () =>
              getUpdates() ? t("updatesOn") : t("updatesOff"),
            ),
          ),
        ),
      ),
      _.Card(
        _.cardBody(
          _.h3(t("liveState")),
          _.p(() => t("liveName", { value: nameModel.value })),
          _.p(() => t("liveRole", { value: roleModel.value })),
          _.p(() => `Search: ${searchModel.value || "-"}`),
          _.p(() => `Calendar: ${calendarModel.value || "-"}`),
          _.div(
            _.h4("Upload events"),
            () => uploadEvents.value.length
              ? _.ul(...uploadEvents.value.map((event) => _.li(event)))
              : _.p("-"),
          ),
          _.p(() => (getUpdates() ? t("liveUpdatesOn") : t("liveUpdatesOff"))),
        ),
      ),
      _.Card(
        _.cardBody(
          _.h3('Bug test'),
          _.p('The select is destroyed by an external parent update while opening; the input is destroyed when its model changes, so it loses focus after the first character.'),
          () =>_.div(
            () => testBug()
          )
        )
      )
    ),
  );
});
