  // ===============================
  // UI meta shared helpers
  // ===============================
  JSswift._uiMetaShared = (() => {
    function resolveDocComponents(_) {
      return {
        hasTabPanel: typeof _.TabPanel === "function",
        Card: typeof _.Card === "function"
          ? _.Card
          : (...children) => _.div({ class: "jss-doc-card" }, ...children),
        Chip: typeof _.Chip === "function"
          ? _.Chip
          : (_props, label) => _.span({ class: "jss-chip jss-chip-fallback" }, label)
      };
    }

    function formatMetaValues(values) {
      if (!values) return "—";
      if (Array.isArray(values)) return values.join(" | ");
      return String(values);
    }

    function renderMetaItem(_, item, Chip) {
      return _.div({ class: "jss-doc-meta" },
        _.div({ class: "jss-doc-meta-head" },
          _.div({ class: "jss-doc-meta-name" }, item.name),
          _.div({ class: "jss-doc-meta-types" },
            ...(item.type
              ? String(item.type).split("|").map((token) => Chip({ color: "secondary", dense: true, outline: true }, token))
              : [_.span("—")])
          )
        ),
        _.div({ class: "jss-doc-meta-grid" },
          _.div({ class: "jss-doc-meta-block" },
            _.div({ class: "jss-doc-meta-label" }, "Default"),
            _.div({ class: "jss-doc-meta-value" }, item.default == null ? "—" : String(item.default))
          ),
          _.div({ class: "jss-doc-meta-block" },
            _.div({ class: "jss-doc-meta-label" }, "Values"),
            _.div({ class: "jss-doc-meta-value" }, formatMetaValues(item.values))
          )
        ),
        _.div({ class: "jss-doc-meta-block" },
          _.div({ class: "jss-doc-meta-label" }, "Description"),
          _.div({ class: "jss-doc-meta-value" }, item.description || "—")
        )
      );
    }

    function renderTabGroupFallback(_, rows) {
      return _.div({ class: "jss-doc-fallback" },
        rows.map((row) => _.div({ class: "jss-doc-fallback-item" },
          _.h4({ class: "jss-doc-fallback-title" }, row.label || row.name),
          row.content
        ))
      );
    }

    function normalizeEventRows(_, events) {
      if (!events) return [];
      if (Array.isArray(events)) {
        return events.map((eventItem) => ({
          name: eventItem.name,
          wrap: true,
          label: eventItem.name,
          content: _.div({ class: "jss-p-md" }, eventItem.description)
        }));
      }
      return Object.entries(events).map(([key, value]) => ({
        name: key,
        wrap: true,
        label: key,
        content: _.div({ class: "jss-p-md" }, value)
      }));
    }

    function normalizeSlotRows(_, slots) {
      if (!slots) return [];
      if (Array.isArray(slots)) {
        return slots.map((slot) => ({
          name: slot.name,
          wrap: true,
          label: slot.type,
          content: slot.description
        }));
      }
      return Object.entries(slots).map(([key, value]) => ({
        name: key,
        wrap: true,
        label: key,
        content: _.div({ class: "jss-doc-meta" },
          _.div({ class: "jss-doc-meta-head" },
            _.div({ class: "jss-doc-meta-name" }, key)
          ),
          _.div({ class: "jss-doc-meta-grid" },
            _.div({ class: "jss-doc-meta-block" },
              _.div({ class: "jss-doc-meta-label" }, "Type"),
              _.div({ class: "jss-doc-meta-value" }, value.type || "—")
            )
          ),
          _.div({ class: "jss-doc-meta-block" },
            _.div({ class: "jss-doc-meta-label" }, "Description"),
            _.div({ class: "jss-doc-meta-value" }, value.description || "—")
          )
        )
      }));
    }

    return {
      resolveDocComponents,
      renderMetaItem,
      renderTabGroupFallback,
      normalizeEventRows,
      normalizeSlotRows
    };
  })();
