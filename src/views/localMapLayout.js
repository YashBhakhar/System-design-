/*
 * Positions for the Explore map: one concept in the centre,
 * "Know first" on the left, "Leads to" + "Related" on the right,
 * "Don't confuse with" below. On narrow screens everything stacks top to bottom.
 *
 * Input: nodes [{ id, role, w, h }] (sizes measured from the DOM), and the area W×H.
 * Output: { pos: { id: {x, y, w, h} }, labels: [{text, x, y}], wires: [{ id, d, kind }] }
 */
const GAP = 12;
const LABEL = 30;
const GROUP = 24;

export function layoutLocalMap(nodes, W, H) {
  const by = (role) => nodes.filter((n) => n.role === role);
  const center = by("center")[0];
  const pre = by("pre"), lead = by("lead"), related = by("related"), conf = by("confused");
  const pos = {};
  const labels = [];
  const place = (n, x, y) => (pos[n.id] = { x: Math.round(x), y: Math.round(y), w: n.w, h: n.h });
  const narrow = W < 640;

  // A column of labelled groups. alignRight: pills end at x. Returns the height.
  const stack = (groups, x, alignRight, top, draw) => {
    let y = top;
    for (const g of groups) {
      if (!g.list.length) continue;
      if (draw) labels.push({ text: g.label, x: alignRight ? x - Math.max(...g.list.map((n) => n.w)) : x, y });
      y += LABEL;
      for (const n of g.list) {
        if (draw) place(n, alignRight ? x - n.w : x, y);
        y += n.h + GAP;
      }
      y += GROUP - GAP;
    }
    return Math.max(0, y - top - GROUP);
  };

  // Pills wrapped into centred rows. Returns the height.
  const rows = (list, top, draw) => {
    const lines = [[]];
    let width = 0;
    for (const n of list) {
      if (width + n.w > W - 24 && lines.at(-1).length) {
        lines.push([]);
        width = 0;
      }
      lines.at(-1).push(n);
      width += n.w + 8;
    }
    let y = top;
    for (const line of lines) {
      if (!line.length) continue;
      const total = line.reduce((s, n) => s + n.w, 0) + 8 * (line.length - 1);
      let x = (W - total) / 2;
      for (const n of line) {
        if (draw) place(n, x, y);
        x += n.w + 8;
      }
      y += line[0].h + 8;
    }
    return list.length ? y - top - 8 : 0;
  };

  if (narrow) {
    const below = [...lead, ...related];
    const sections = [
      { label: "Know first", list: pre },
      { label: "center" },
      { label: lead.length ? "Leads to · related" : "Related", list: below },
      { label: "Don't confuse with", list: conf }
    ].filter((s) => s.label === "center" || s.list.length);
    const heightOf = (s) => (s.label === "center" ? center.h : LABEL + rows(s.list, 0, false));
    const total = sections.reduce((sum, s) => sum + heightOf(s), 0) + 56 * (sections.length - 1);
    let y = Math.max(16, (H - total) / 2);
    for (const s of sections) {
      if (s.label === "center") place(center, (W - center.w) / 2, y);
      else {
        labels.push({ text: s.label, x: 12, y });
        rows(s.list, y + LABEL, true);
      }
      y += heightOf(s) + 56;
    }
  } else {
    const cx = W / 2;
    const right = [
      { label: "Leads to", list: lead },
      { label: "Related", list: related }
    ];
    const leftH = stack([{ label: "Know first", list: pre }], 0, true, 0, false);
    const rightH = stack(right, 0, false, 0, false);
    const confH = conf.length ? 96 + conf[0].h : 0;
    const bodyH = Math.max(leftH, rightH, center.h);
    const top = Math.max(24, (H - bodyH - confH) / 2);
    const cy = top + bodyH / 2;
    place(center, cx - center.w / 2, cy - center.h / 2);
    const c = pos[center.id];
    const spread = Math.min(200, W * 0.14);
    stack([{ label: "Know first", list: pre }], c.x - spread, true, cy - leftH / 2, true);
    stack(right, c.x + c.w + spread, false, cy - rightH / 2, true);
    if (conf.length) {
      const y = top + bodyH + 96;
      const total = conf.reduce((s, n) => s + n.w, 0) + 12 * (conf.length - 1);
      let x = cx - total / 2;
      for (const n of conf) {
        place(n, x, y);
        x += n.w + 12;
      }
      // Beside the dashed line, never on it.
      labels.push({ text: "Don't confuse with", x: cx + 14, y: (c.y + c.h + y) / 2 - 8 });
    }
  }

  // Curved wires between final positions.
  const across = (a, b) => {
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, dx = (x2 - x1) / 2;
    return `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };
  const down = (a, b) => {
    const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, dy = (y2 - y1) / 2;
    return `M${x1} ${y1} C${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  };
  const link = narrow ? down : across;
  const c = pos[center.id];
  const wires = [
    ...pre.map((n) => ({ id: n.id, kind: "pre", d: link(pos[n.id], c) })),
    ...lead.map((n) => ({ id: n.id, kind: "lead", d: link(c, pos[n.id]) })),
    ...related.map((n) => ({ id: n.id, kind: "related", d: link(c, pos[n.id]) })),
    ...conf.map((n) => ({ id: n.id, kind: "confused", d: down(c, pos[n.id]) }))
  ];

  return { pos, labels, wires };
}
