import type { EvaluatorRole, RoundType } from "@/lib/api/types";

export function validateUsername(value: string): string | null {
  const username = value.trim();
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 50) return "Username must be at most 50 characters.";
  return null;
}

export function validatePassword(value: string, required: boolean): string | null {
  if (!required && value.trim() === "") return null;
  if (value.length < 6) return "Password must be at least 6 characters.";
  return null;
}

export function validateRole(value: string): value is EvaluatorRole {
  return value === "MENTOR" || value === "JUDGE";
}

export function validateRoundName(value: string): string | null {
  if (!value.trim()) return "Round name is required.";
  return null;
}

export function validateRoundType(value: string): value is RoundType {
  return value === "MENTORING" || value === "JUDGING";
}

export function validateRoundNumber(value: string): string | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return "Round number must be a positive integer.";
  }
  return null;
}

export function validateCriterionName(value: string): string | null {
  if (!value.trim()) return "Criterion name is required.";
  return null;
}

export function validateMaxScore(value: string): string | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "Max score must be a positive number.";
  }
  return null;
}

export function validatePanelName(value: string): string | null {
  if (!value.trim()) return "Panel name is required.";
  return null;
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function validateNote(value: string): string | null {
  if (countWords(value) > 250) return "Note must be 250 words or fewer.";
  return null;
}
