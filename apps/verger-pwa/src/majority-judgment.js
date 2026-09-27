import { activeRecords, newId } from "./domain.js";

export const MJ_POLL_FORMAT = "verger-majority-judgment-poll";
export const MJ_RESULT_FORMAT = "verger-majority-judgment-result";
export const MJ_CONTRACT_VERSION = 1;

export function prepareMajorityJudgmentPoll(
  doc,
  meetingId,
  proposalIds,
  { question = "", gradingPreset = "quality-5" } = {},
) {
  const meeting = doc.meetings?.[meetingId];
  if (!meeting || meeting.archived) throw new Error("Réunion introuvable");

  const selected = [...new Set((proposalIds || []).map(String))]
    .map((id) => meeting.proposals?.[id])
    .filter((proposal) => proposal && !proposal.archived);

  if (!selected.length) throw new Error("Sélectionnez au moins une proposition");

  return {
    format: MJ_POLL_FORMAT,
    schemaVersion: MJ_CONTRACT_VERSION,
    pollId: newId("mj-poll"),
    question: String(question || meeting.title || "Jugement majoritaire").trim().slice(0, 500),
    gradingPreset: String(gradingPreset || "quality-5").slice(0, 80),
    source: {
      meetingId: String(meetingId),
      proposalIds: selected.map((proposal) => String(proposal.id)),
    },
    choices: selected.map((proposal) => ({
      id: String(proposal.id),
      label: String(proposal.title || "").slice(0, 240),
    })),
    createdAt: new Date().toISOString(),
  };
}

export function validateAggregatedMajorityJudgmentResult(raw, expectedPoll = null) {
  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!result || result.format !== MJ_RESULT_FORMAT) throw new Error("Résultat de jugement majoritaire invalide");
  if (Number(result.schemaVersion) !== MJ_CONTRACT_VERSION) throw new Error("Version de résultat non prise en charge");
  if (!result.pollId || !Array.isArray(result.choices) || !Number.isInteger(result.ballotCount) || result.ballotCount < 0) {
    throw new Error("Résultat agrégé incomplet");
  }
  if (containsIndividualBallots(result)) throw new Error("Les bulletins individuels ne doivent pas être importés dans Verger");

  if (expectedPoll) {
    if (expectedPoll.format !== MJ_POLL_FORMAT) throw new Error("Contrat de scrutin attendu invalide");
    if (String(result.pollId) !== String(expectedPoll.pollId)) throw new Error("Le résultat ne correspond pas au scrutin préparé");

    const expectedIds = new Set((expectedPoll.choices || []).map((choice) => String(choice.id)));
    const returnedIds = new Set(result.choices.map((choice) => String(choice.id)));
    if (expectedIds.size !== returnedIds.size || [...expectedIds].some((id) => !returnedIds.has(id))) {
      throw new Error("Les propositions du résultat ne correspondent pas au scrutin préparé");
    }
  }

  for (const choice of result.choices) {
    if (!choice?.id) throw new Error("Proposition de résultat sans identifiant");
    if (!Number.isInteger(choice.rank) || choice.rank < 1) throw new Error("Classement agrégé invalide");
    if (!choice.majorityGrade) throw new Error("Mention majoritaire manquante");
    if (!Array.isArray(choice.distribution)) throw new Error("Distribution agrégée manquante");
    for (const grade of choice.distribution) {
      if (!grade?.grade || !Number.isInteger(grade.count) || grade.count < 0) {
        throw new Error("Distribution agrégée invalide");
      }
    }
  }

  return {
    format: MJ_RESULT_FORMAT,
    schemaVersion: MJ_CONTRACT_VERSION,
    pollId: String(result.pollId),
    closedAt: String(result.closedAt || "").slice(0, 40),
    ballotCount: result.ballotCount,
    choices: result.choices.map((choice) => ({
      id: String(choice.id),
      rank: choice.rank,
      majorityGrade: String(choice.majorityGrade).slice(0, 120),
      distribution: choice.distribution.map((grade) => ({
        grade: String(grade.grade).slice(0, 120),
        count: grade.count,
      })),
    })),
    engine: result.engine ? {
      name: String(result.engine.name || "").slice(0, 120),
      version: String(result.engine.version || "").slice(0, 120),
    } : null,
    inputHash: result.inputHash ? String(result.inputHash).slice(0, 256) : "",
  };
}

export function majorityJudgmentResultSummary(result) {
  const safe = validateAggregatedMajorityJudgmentResult(result);
  const ranking = [...safe.choices]
    .sort((a, b) => a.rank - b.rank)
    .map((choice) => `${choice.rank}. ${choice.id} — ${choice.majorityGrade}`);
  return [
    `Bulletins : ${safe.ballotCount}`,
    ...ranking,
  ].join("\n");
}

function containsIndividualBallots(value) {
  if (!value || typeof value !== "object") return false;
  const forbidden = new Set(["ballots", "individualBallots", "individualVotes", "votes"]);
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key)) return true;
    if (containsIndividualBallots(child)) return true;
  }
  return false;
}

export function availableProposalIds(doc, meetingId) {
  return activeRecords(doc.meetings?.[meetingId]?.proposals || {}).map((proposal) => proposal.id);
}
