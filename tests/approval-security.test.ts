import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  adSpaces,
  evaluatePurchasability,
  getPurchasableAdSpace,
  publicAdSpaces,
  type CreatorApprovalStatus,
} from "../src/lib/data.ts";

test("only approved creators with available inventory can be purchased", () => {
  const statuses: CreatorApprovalStatus[] = [
    "pending",
    "rejected",
    "suspended",
  ];
  for (const creatorApprovalStatus of statuses) {
    assert.deepEqual(
      evaluatePurchasability({
        creatorApprovalStatus,
        status: "available",
      }),
      { allowed: false, reason: "creator_not_approved" },
    );
  }
  assert.deepEqual(
    evaluatePurchasability({
      creatorApprovalStatus: "approved",
      status: "available",
    }),
    { allowed: true },
  );
  assert.deepEqual(
    evaluatePurchasability({
      creatorApprovalStatus: "approved",
      status: "sold",
    }),
    { allowed: false, reason: "listing_unavailable" },
  );
});

test("public demo inventory excludes pending creator listings", () => {
  assert(adSpaces.some(({ creatorApprovalStatus }) => creatorApprovalStatus === "pending"));
  assert(
    publicAdSpaces.every(
      ({ creatorApprovalStatus, status }) =>
        creatorApprovalStatus === "approved" && status === "available",
    ),
  );
  assert.equal(getPurchasableAdSpace("camera-strap"), undefined);
  assert(getPurchasableAdSpace("hat-front"));
});

test("RLS migration enforces approval, ownership, and admin boundaries", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/002_creator_approval.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /creator\.approval_status = 'approved'/);
  assert.match(migration, /a\.status = 'available'/);
  assert.match(migration, /auth\.jwt\(\) -> 'app_metadata' ->> 'role'/);
  assert.match(migration, /protect_profile_moderation_fields/);
  assert.match(migration, /Creator approval fields may only be changed by an administrator/);
  assert.match(migration, /submit_creator_for_review/);
  assert.match(migration, /type = 'advertiser'/);
});
