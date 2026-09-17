JSswift.ready(() => {
  const root = document.getElementById("jsswift-playground");
  if (!root) return;
  const t = (key, replacements = {}) =>
    window.JSswiftDemoI18n?.t(`playground.core.${key}`, replacements) ?? key;

  const [count, setCount] = _.signal(1);
  const [step, setStep] = _.signal(2);
  const total = _.computed(() => count() * step());

  const CounterBox = _.component((props, ctx) => {
    const [ticks, setTicks] = _.signal(0);
    const timer = setInterval(() => setTicks(ticks() + 1), 1000);
    ctx.onDispose(() => clearInterval(timer));

    return _.div(
      { class: "card", style: { marginTop: "16px" } },
      _.h3(t("lifecycleTitle")),
      _.p(t("lifecycleCopy")),
      _.p(() => t("ticksLine", { value: ticks() })),
    );
  });

  _.mount(
    root,
    _.div(
      { class: "card" },
      _.h3(t("cardTitle")),
      _.p(t("cardCopy")),
      _.div(
        {
          style: {
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            margin: "16px 0",
          },
        },
        _.button({ onClick: () => setCount(count() + 1) }, t("countButton")),
        _.button({ onClick: () => setStep(step() + 1) }, t("stepButton")),
        _.button(
          {
            onClick: () =>
              _.batch(() => {
                setCount(count() + 1);
                setStep(step() + 2);
              }),
          },
          t("batchButton"),
        ),
      ),
      _.p(() => t("countLine", { value: count() })),
      _.p(() => t("stepLine", { value: step() })),
      _.p(() => t("totalLine", { value: total() })),
      CounterBox(),
    ),
  );
});
