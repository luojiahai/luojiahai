// Generates assets/terminal.svg. Run: node scripts/terminal.mjs
import { writeFileSync } from "node:fs";

const LOOP = 9;
const CELL = 9;
const X0 = 20;
const LINE = 22;
const Y0 = 68;
const TYPE_START = 0.975;
const TYPE_STEP = 0.075;
const OUTPUT_DELAY = 0.45;
const BLINK = 0.55;
const BLINK_START_DELAY = 0.3;

const FG = "#c9d1d9";
const DIM = "#8b949e";
const HOST = "#7ee787";
const PATH = "#79c0ff";

const prompt = [[HOST, "luojiahai@mac"], " ", [PATH, "~"], " %"];
const command = "whoami --verbose";
const output = [
  [[null, "luojiahai", ' font-weight="700"']],
  [[DIM, "personality:"], " INTJ"],
  prompt,
];

const len = (parts) => parts.reduce((n, p) => n + (Array.isArray(p) ? p[1] : p).length, 0);
const cells = (n) => Array.from({ length: n }, (_, i) => X0 + i * CELL).join(" ");
const text = (parts, y) =>
  `<text x="${cells(len(parts))}" y="${y}" xml:space="preserve">` +
  parts.map((p) => (Array.isArray(p) ? `<tspan${p[0] ? ` fill="${p[0]}"` : ""}${p[2] ?? ""}>${p[1]}</tspan>` : p)).join("") +
  `</text>`;
const key = (t) => (Math.round((t / LOOP) * 1e4) / 1e4).toString();
const animate = (attr, frames) =>
  `<animate attributeName="${attr}" dur="${LOOP}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${frames.map(([t]) => key(t)).join(";")}" values="${frames.map(([, v]) => v).join(";")}"/>`;

const promptCells = len(prompt) + 1;
const typeEnd = TYPE_START + (command.length - 1) * TYPE_STEP;
const outputAt = typeEnd + OUTPUT_DELAY;
const blinkStart = outputAt + BLINK_START_DELAY;
const cursorX0 = X0 + promptCells * CELL;
const cursorY = (line) => Y0 + line * LINE - 16;
const keystrokes = Array.from({ length: command.length }, (_, i) => [TYPE_START + i * TYPE_STEP, (i + 1) * CELL]);
const hold = (frames) => [...frames, [LOOP, frames.at(-1)[1]]];

const clipWidth = hold([[0, promptCells * CELL], ...keystrokes.map(([t, dx]) => [t, promptCells * CELL + dx])]);
const cursorXFrames = hold([[0, cursorX0], ...keystrokes.map(([t, dx]) => [t, cursorX0 + dx]), [outputAt, cursorX0]]);
const cursorYFrames = hold([[0, cursorY(0)], [outputAt, cursorY(output.length)]]);
const blinks = [];
for (let t = blinkStart, on = true; t < LOOP; t += BLINK, on = !on) blinks.push([t, on ? 0.85 : 0]);
const cursorOpacity = [[0, 0.85], [BLINK, 0], [BLINK + 0.35, 0.85], ...blinks, [LOOP, 0]];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <defs>
    <clipPath id="win"><rect width="800" height="200" rx="10"/></clipPath>
    <clipPath id="c1"><rect x="${X0}" y="${cursorY(0)}" width="${promptCells * CELL}" height="${LINE}">${animate("width", clipWidth)}</rect></clipPath>
  </defs>
  <g clip-path="url(#win)">
    <rect width="800" height="200" fill="#0d1117"/>
    <rect width="800" height="36" fill="#161b22"/>
    <line x1="0" y1="36.5" x2="800" y2="36.5" stroke="#30363d"/>
  </g>
  <rect x=".5" y=".5" width="799" height="199" rx="10" fill="none" stroke="#30363d"/>
  <circle cx="20" cy="18" r="6" fill="#ff5f57"/><circle cx="40" cy="18" r="6" fill="#febc2e"/><circle cx="60" cy="18" r="6" fill="#28c840"/>
  <text x="400" y="22.5" text-anchor="middle" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12.5" fill="${DIM}">luojiahai — zsh — 80×24</text>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace" font-size="15" fill="${FG}">
    <g clip-path="url(#c1)">${text([...prompt, " " + command], Y0)}</g>
    <g opacity="0">${animate("opacity", hold([[0, 0], [outputAt, 1]]))}${output.map((parts, i) => text(parts, Y0 + (i + 1) * LINE)).join("")}</g>
  </g>
  <rect x="${cursorX0}" y="${cursorY(0)}" width="${CELL}" height="21" fill="${FG}" opacity=".85">
    ${animate("x", cursorXFrames)}
    ${animate("y", cursorYFrames)}
    ${animate("opacity", cursorOpacity)}
  </rect>
</svg>
`;

writeFileSync(new URL("../assets/terminal.svg", import.meta.url), svg);
