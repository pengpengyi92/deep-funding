import type { MessageType, Run, TraceEvent } from "../schemas";
import { ENGINE_VERSION } from "../agents";
export function createRun(now: Date): Run {
  return {
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    engineVersion: ENGINE_VERSION,
    execution: "deterministic",
    events: [],
  };
}
export function emit(
  run: Run,
  type: MessageType,
  from: string,
  to: string,
  summary: string,
  payload: Record<string, unknown> = {},
  evidenceRefs: string[] = [],
): TraceEvent {
  const event: TraceEvent = {
    id: crypto.randomUUID(),
    protocolVersion: "1.0",
    sequence: run.events.length + 1,
    timestamp: run.createdAt,
    type,
    from,
    to,
    summary,
    payload,
    evidenceRefs,
  };
  run.events.push(event);
  return event;
}
