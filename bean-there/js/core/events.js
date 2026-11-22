// Tiny event bus: modules talk through events so they never depend on each other.
const h = {};
export const on = (e, f) => (h[e] ??= []).push(f);
export const emit = (e, d) => (h[e] || []).forEach(f => f(d));
