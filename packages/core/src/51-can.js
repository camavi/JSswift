  // ===============================
  // Can component (hyperscript-friendly)
  // ===============================
  JSswift.Can = function Can(props, ctx) {
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;

    const pred = () => {
      if (!auth) return false;
      if (props.when && typeof props.when === "function") return !!props.when(auth);
      if (props.perm) return !!auth.can?.(props.perm);
      if (props.role) return !!auth.hasRole?.(props.role);
      if (props.any) return !!auth.canAny?.(props.any);
      if (props.all) return !!auth.canAll?.(props.all);
      return false;
    };

    return pred()
      ? (typeof props.then === "function" ? props.then() : props.then ?? null)
      : (typeof props.else === "function" ? props.else() : props.else ?? null);
  };
