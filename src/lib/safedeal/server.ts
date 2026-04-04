import type { PostgrestError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type JsonObject = Record<string, unknown>;

export interface AuthenticatedProfileContext {
  profile: {
    id: string;
    wallet_address: string;
  };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  const body = await request.json().catch(() => {
    throw new ApiError(400, "Invalid JSON payload.");
  });

  return body as T;
}

export function parseUuid(value: unknown, fieldName: string): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw new ApiError(400, `${fieldName} must be a valid UUID.`);
  }

  return value;
}

export function parseNonEmptyText(
  value: unknown,
  fieldName: string,
  maxLength: number
): string {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new ApiError(400, `${fieldName} cannot be empty.`);
  }

  if (trimmedValue.length > maxLength) {
    throw new ApiError(
      400,
      `${fieldName} must be ${maxLength} characters or fewer.`
    );
  }

  return trimmedValue;
}

export function parseOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parseNonEmptyText(value, fieldName, maxLength);
}

export function parsePositiveInteger(value: unknown, fieldName: string): number {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer.`);
  }

  return parsedValue;
}

export function parseJsonObject(
  value: unknown,
  fieldName: string
): JsonObject {
  if (value === undefined || value === null) {
    return {};
  }

  if (!isRecord(value)) {
    throw new ApiError(400, `${fieldName} must be a JSON object.`);
  }

  return value;
}

export async function requireAuthenticatedProfile(): Promise<AuthenticatedProfileContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new ApiError(401, "You must be signed in.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new ApiError(
      403,
      "SafeDeal profile not found. Complete the wallet bootstrap first."
    );
  }

  return {
    profile,
    supabase,
  };
}

export function throwIfDatabaseError(
  error: PostgrestError | null,
  fallbackMessage: string
): void {
  if (!error) {
    return;
  }

  switch (error.code) {
    case "23503":
    case "PGRST116":
      throw new ApiError(404, fallbackMessage);
    case "23505":
      throw new ApiError(409, fallbackMessage);
    case "23514":
      throw new ApiError(400, error.message || fallbackMessage);
    case "42501":
      throw new ApiError(403, "You do not have permission to perform this action.");
    default:
      throw new ApiError(500, fallbackMessage);
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  if (isPostgrestError(error)) {
    console.error("[SafeDeal API] database error:", error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }

  console.error("[SafeDeal API] unexpected error:", error);

  return NextResponse.json(
    {
      error: "Internal server error.",
    },
    {
      status: 500,
    }
  );
}
