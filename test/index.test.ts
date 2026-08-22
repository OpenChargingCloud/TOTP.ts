// The example token values and rejection cases that used to be duplicated
// here live in the canonical conformance vectors now (test/vectors/, run by
// vectors.test.ts and shared with the C# TOTPGenerator in Vanaheimr Hermod
// via https://github.com/OpenChargingCloud/TOTPConformanceTests). This file
// keeps the structural properties of the frozen token format that hold for
// ALL inputs, beyond the pinned example values.

import { describe, expect, it } from "vitest";

import { generateTOTPs } from "../src/index.js";

describe("Token format properties", () => {

  it("reads the hash as a ring buffer: a 64 character sha256 token repeats its first 32 characters verbatim", () => {
    expect(generateTOTPs("secure!Charging!", 30, 64, null, 1718611200000, "sha256").current)
      .toBe("akF3c7qY2uiuO4rpyU0SC0W8VFE6nvxz".repeat(2));
  });

  it("does not repeat a 64 character sha512 token, as its hash has 64 bytes", () => {
    const totp = generateTOTPs("secure!Charging!", 30, 64, null, 1718611200000, "sha512").current;
    expect(totp.slice(32)).not.toBe(totp.slice(0, 32));
  });

  it("wraps the previous slot to 2^64 - 1 within the first slot after the Unix epoch, like the unchecked UInt64 arithmetic in C#", () => {
    expect(generateTOTPs("secure!Charging!", 30, 12, null, 0)).toEqual({
      previous:       "SzcwtcR5qcY7",
      current:        "u5CoKdo5HUS1",
      next:           "tVGiyLys7Y1V",
      remainingTime:   30
    });
  });

  it("defaults to HMAC-SHA256", () => {
    expect(generateTOTPs("secure!Charging!", null, null, null, 1718611200000).current)
      .toBe(generateTOTPs("secure!Charging!", null, null, null, 1718611200000, "sha256").current);
  });

  it("overlaps previous/current/next across adjacent slots", () => {
    const timestamp = 1718611200000;
    const next0     = generateTOTPs("secure!Charging!", null, null, null, timestamp).next;
    const current1  = generateTOTPs("secure!Charging!", null, null, null, timestamp + 30_000).current;
    const previous2 = generateTOTPs("secure!Charging!", null, null, null, timestamp + 60_000).previous;
    expect(current1).toBe(next0);
    expect(previous2).toBe(next0);
  });

});
