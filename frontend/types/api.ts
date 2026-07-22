// Error shapes FastAPI produces (see docs/adr/0004-error-handling.md):
// expected errors and the catch-all handler use {"detail": string}; Pydantic
// validation failures use {"detail": ValidationIssue[]}.

export interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorBody {
  detail: string | ValidationIssue[];
}

/** Normalizes either detail shape into something renderable. */
export function apiErrorMessage(body: ApiErrorBody): string {
  if (typeof body.detail === "string") return body.detail;
  return body.detail
    .map((issue) => `${issue.loc.slice(1).join(".")}: ${issue.msg}`)
    .join("; ");
}
