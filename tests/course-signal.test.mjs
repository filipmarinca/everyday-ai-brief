import test from "node:test";
import assert from "node:assert/strict";
import { parseCourse, needsNotice } from "../scripts/course-signal.mjs";

const course = { id: 7257379, is_paid: true, num_subscribers: 0, num_reviews: 0 };
test("a paid listing and enrollments never become payment evidence", () => {
  const observation = parseCourse({ ...course, num_subscribers: 2 });
  assert.equal(observation.paidRevenueVerified, false);
  assert.equal(observation.publicEnrollments, 2);
});
test("invalid public API responses fail rather than defaulting to zero", () => {
  for (const data of [null, {}, { ...course, id: 1 }, { ...course, num_subscribers: "2" }, { ...course, num_reviews: -1 }]) {
    assert.throws(() => parseCourse(data), /valid enrollment fields/);
  }
});
test("zero enrollments do not generate a notice", () => {
  assert.equal(needsNotice(parseCourse(course), []), false);
});
test("an existing notice prevents duplicates even if it is closed", () => {
  const observation = parseCourse({ ...course, num_subscribers: 3 });
  assert.equal(needsNotice(observation, []), true);
  assert.equal(needsNotice(observation, [{
    title: "Course enrollment changed; paid revenue still needs verification",
    state: "closed"
  }]), false);
});
