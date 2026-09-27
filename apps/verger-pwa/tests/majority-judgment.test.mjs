import assert from "node:assert/strict";
import { addMeeting, addProposal, createInitialState } from "../src/domain.js";
import {
  MJ_POLL_FORMAT,
  MJ_RESULT_FORMAT,
  majorityJudgmentResultSummary,
  prepareMajorityJudgmentPoll,
  validateAggregatedMajorityJudgmentResult,
} from "../src/majority-judgment.js";

const doc = createInitialState("Test vote");
const meeting = addMeeting(doc, { title: "Choix du projet" });
const a = addProposal(doc, meeting, { title: "Projet A" });
const b = addProposal(doc, meeting, { title: "Projet B" });

const poll = prepareMajorityJudgmentPoll(doc, meeting, [a, b], { question: "Quel projet retenir ?" });
assert.equal(poll.format, MJ_POLL_FORMAT);
assert.deepEqual(poll.source.proposalIds, [a, b]);
assert.equal(poll.choices.length, 2);

const result = {
  format: MJ_RESULT_FORMAT,
  schemaVersion: 1,
  pollId: poll.pollId,
  closedAt: "2026-09-27T18:00:00Z",
  ballotCount: 3,
  choices: [
    { id: a, rank: 1, majorityGrade: "Bien", distribution: [{ grade: "Bien", count: 3 }] },
    { id: b, rank: 2, majorityGrade: "Passable", distribution: [{ grade: "Passable", count: 3 }] },
  ],
  engine: { name: "Mieux Voter", version: "test" },
};

const safe = validateAggregatedMajorityJudgmentResult(result, poll);
assert.equal(safe.ballotCount, 3);
assert.match(majorityJudgmentResultSummary(safe), /Bulletins : 3/);

assert.throws(() => validateAggregatedMajorityJudgmentResult({ ...result, ballots: [{ secret: true }] }, poll));
assert.throws(() => validateAggregatedMajorityJudgmentResult({ ...result, pollId: "wrong" }, poll));
assert.throws(() => validateAggregatedMajorityJudgmentResult({ ...result, choices: [result.choices[0]] }, poll));

console.log("Tests contrat jugement majoritaire : OK");
