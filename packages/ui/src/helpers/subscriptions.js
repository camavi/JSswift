

  // Component-owned subscriptions; shared models remain caller-owned.
  function uiSubscriptionScope() {
    const stops = [];
    return {
      effect: (fn, name) => { const stop = JSswift.reactive.effect(fn, name); stops.push(stop); return stop; },
      action: (rod, fn) => {
        rod.action(fn);
        stops.push(() => { const i = rod._actions?.indexOf(fn) ?? -1; if (i >= 0) rod._actions.splice(i, 1); });
      },
      dispose: () => stops.splice(0).forEach(stop => stop())
    };
  }
