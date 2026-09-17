  // ===============================
  // UI meta shared helpers
  // ===============================
  JSswift._uiMetaShared = (() => {
    function resolveDocComponents(_) {
      return {
        hasTabPanel: typeof _.TabPanel === "function",
        Card: typeof _.Card === "function"
          ? _.Card
          : (...children) => _.div({ class: "cms-doc-card" }, ...children),
        Chip: typeof _.Chip === "function"
          ? _.Chip
          : (_props, label) => _.span({ class: "cms-chip cms-chip-fallback" }, label)
      };
    }

    function formatMetaValues(values) {
      if (!values) return "—";
      if (Array.isArray(values)) return values.join(" | ");
      return String(values);
    }

    function renderMetaItem(_, item, Chip) {
      return _.div({ class: "cms-doc-meta" },
        _.div({ class: "cms-doc-meta-head" },
          _.div({ class: "cms-doc-meta-name" }, item.name),
          _.div({ class: "cms-doc-meta-types" },
            ...(item.type
              ? String(item.type).split("|").map((token) => Chip({ color: "secondary", dense: true, outline: true }, token))
              : [_.span("—")])
          )
        ),
        _.div({ class: "cms-doc-meta-grid" },
          _.div({ class: "cms-doc-meta-block" },
            _.div({ class: "cms-doc-meta-label" }, "Default"),
            _.div({ class: "cms-doc-meta-value" }, item.default == null ? "—" : String(item.default))
          ),
          _.div({ class: "cms-doc-meta-block" },
            _.div({ class: "cms-doc-meta-label" }, "Values"),
            _.div({ class: "cms-doc-meta-value" }, formatMetaValues(item.values))
          )
        ),
        _.div({ class: "cms-doc-meta-block" },
          _.div({ class: "cms-doc-meta-label" }, "Description"),
          _.div({ class: "cms-doc-meta-value" }, item.description || "—")
        )
      );
    }

    function renderTabGroupFallback(_, rows) {
      return _.div({ class: "cms-doc-fallback" },
        rows.map((row) => _.div({ class: "cms-doc-fallback-item" },
          _.h4({ class: "cms-doc-fallback-title" }, row.label || row.name),
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
          content: _.div({ class: "cms-p-md" }, eventItem.description)
        }));
      }
      return Object.entries(events).map(([key, value]) => ({
        name: key,
        wrap: true,
        label: key,
        content: _.div({ class: "cms-p-md" }, value)
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
        content: _.div({ class: "cms-doc-meta" },
          _.div({ class: "cms-doc-meta-head" },
            _.div({ class: "cms-doc-meta-name" }, key)
          ),
          _.div({ class: "cms-doc-meta-grid" },
            _.div({ class: "cms-doc-meta-block" },
              _.div({ class: "cms-doc-meta-label" }, "Type"),
              _.div({ class: "cms-doc-meta-value" }, value.type || "—")
            )
          ),
          _.div({ class: "cms-doc-meta-block" },
            _.div({ class: "cms-doc-meta-label" }, "Description"),
            _.div({ class: "cms-doc-meta-value" }, value.description || "—")
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
