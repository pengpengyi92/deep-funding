import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SHOTS,
  DURATION,
  FPS,
  shotAt,
  cameraAt,
  startupPosition,
  agentState,
} from "../src/timeline.js";
test("storyboard is continuous and within video spec", () => {
  assert.equal(SHOTS[0].start, 0);
  assert.equal(SHOTS.at(-1).end, DURATION);
  assert.ok(DURATION >= 20 && DURATION <= 30);
  assert.equal(FPS, 30);
  SHOTS.forEach((s, i) => {
    if (i) assert.equal(SHOTS[i - 1].end, s.start);
  });
});
test("all 840 frames have finite camera and position", () => {
  for (let i = 0; i < 840; i++) {
    const t = i / FPS,
      c = cameraAt(t);
    assert.ok(
      [...c.position, ...c.target, c.fov, ...startupPosition(t)].every(
        Number.isFinite,
      ),
    );
    assert.ok(shotAt(t));
  }
});
test("random access does not depend on earlier frames", () => {
  const first = cameraAt(14.5);
  cameraAt(26);
  assert.deepEqual(cameraAt(14.5), first);
  assert.deepEqual(startupPosition(9), [-11.6, 0.62, 1]);
});
test("startup crosses from company to funding interior", () => {
  assert.ok(startupPosition(12)[0] < 0);
  assert.ok(startupPosition(17)[0] > 0);
  assert.ok(startupPosition(18)[2] < 2);
});
test("camera does not teleport across shot boundaries", () => {
  for (let i = 1; i < 840; i++) {
    const a = cameraAt((i - 1) / FPS),
      b = cameraAt(i / FPS);
    const distance = Math.hypot(...a.position.map((v, j) => v - b.position[j]));
    assert.ok(distance < 2, `camera jump ${i} ${distance}`);
  }
});
test("explicit animation lifecycle keeps match and connection separate", () => {
  assert.equal(agentState(9), "IDLE");
  assert.equal(agentState(13), "WALKING");
  assert.equal(agentState(18.5), "SEARCHING");
  assert.equal(agentState(21), "MATCHING");
  assert.equal(agentState(23), "TALKING");
  assert.equal(agentState(26), "CONNECTED");
});
