
  const avatarGetInitials = (value) => {
    if (value == null || value === false) return "";
    const text = String(value)
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    const words = text.split(" ").filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) {
      const token = words[0].replace(/[^a-z0-9]/gi, "");
      return token.slice(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  };

  const avatarStatusState = (value, fallback) => {
    const raw = value == null || value === true ? fallback : value;
    if (raw == null || raw === false) return normalizeState(fallback);
    const token = String(raw).toLowerCase();
    if (token === "online" || token === "available" || token === "active") return "success";
    if (token === "away" || token === "pending") return "warning";
    if (token === "busy" || token === "dnd" || token === "blocked") return "danger";
    if (token === "offline" || token === "idle") return "secondary";
    return normalizeState(token) || normalizeState(fallback);
  };

  const avatarPrimitiveBadge = (value, className = "jss-avatar-badge") => {
    if (value == null || value === false) return null;
    if (value instanceof Node || Array.isArray(value)) return value;
    if (typeof value === "function") return value;
    if (value === true) return _.span({ class: className });
    return _.span({ class: className }, String(value));
  };

  const avatarPrimitiveStatus = (value, color) => {
    if (value == null || value === false) {
      if (!color) return null;
      const fallbackState = avatarStatusState(null, color);
      return _.span({ class: uiClass(["jss-avatar-status", fallbackState ? `jss-state-${fallbackState}` : ""]) });
    }
    if (value instanceof Node || Array.isArray(value)) return value;
    if (typeof value === "function") return value;
    const state = avatarStatusState(value, color);
    if (value === true || state) {
      return _.span({ class: uiClass(["jss-avatar-status", state ? `jss-state-${state}` : ""]) });
    }
    return avatarPrimitiveBadge(value, "jss-avatar-badge");
  };

  const avatarRenderAnchor = (className, nodes) => {
    if (!nodes || !nodes.length) return null;
    return _.span({ class: uiClass(["jss-avatar-anchor", className]) }, ...nodes);
  };
