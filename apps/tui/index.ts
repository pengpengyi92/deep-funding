import { emitKeypressEvents } from "node:readline";
import type { LocalStore } from "../cli/store";
import { TuiModel, renderTui } from "./model";
export async function startTui(store: LocalStore) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "TUI requires an interactive terminal; use CLI --json for automation",
    );
  const model = new TuiModel(store);
  await model.mount(0);
  emitKeypressEvents(process.stdin);
  const priorRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  const draw = () =>
    process.stdout.write(
      "\x1b[2J\x1b[H" +
        renderTui(model, process.stdout.columns, process.stdout.rows),
    );
  process.stdout.write("\x1b[?1049h\x1b[?25l");
  try {
    await new Promise<void>((resolve) => {
      const finish = () => {
        process.stdin.off("keypress", key);
        process.stdout.off("resize", draw);
        resolve();
      };
      const key = async (
        text: string,
        k: { name?: string; ctrl?: boolean },
      ) => {
        if ((k.ctrl && k.name === "c") || (!model.typing && text === "q")) {
          finish();
          return;
        }
        await model.key(
          k.name === "return"
            ? "enter"
            : [
                  "up",
                  "down",
                  "escape",
                  "backspace",
                  "pageup",
                  "pagedown",
                ].includes(k.name ?? "")
              ? k.name!
              : (text ?? ""),
        );
        draw();
      };
      process.stdin.on("keypress", key);
      process.stdout.on("resize", draw);
      draw();
    });
  } finally {
    process.stdin.setRawMode(priorRaw ?? false);
    process.stdin.pause();
    process.stdout.write("\x1b[?25h\x1b[?1049l");
  }
}
