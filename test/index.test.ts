import { describe, expect, it } from "vitest";

import { generateTOTPs } from "../src/index.js";

describe("Validations", () => {

  it("throws an error for empty shared secret", () => {
    expect(() => generateTOTPs("")).toThrow("The given shared secret must not be null or empty!");
  });

  it("throws an error for short shared secret", () => {
    expect(() => generateTOTPs("shortSecret")).toThrow("The length of the given shared secret must be at least 16 characters!");
  });

  it("throws an error for invalid TOTP length", () => {
    expect(() => generateTOTPs("secure!Charging!", 30, 3)).toThrow("The expected length of the TOTP must be between 4 and 255 characters!");
  });

  it("throws an error for invalid alphabet", () => {
    expect(() => generateTOTPs("secure!Charging!", 30, 12, "abc")).toThrow("The given alphabet must contain at least 4 characters!");
  });

  it("throws an error for duplicate characters in alphabet", () => {
    expect(() => generateTOTPs("secure!Charging!", 30, 12, "abcdeff")).toThrow("The given alphabet must not contain duplicate characters!");
  });

  it("throws an error for whitespace characters in alphabet", () => {
    expect(() => generateTOTPs("secure!Charging!", 30, 12, "ab cdef")).toThrow("The given alphabet must not contain any whitespace characters!");
  });

});


describe("Generate TOTPs", () => {

  it("generates deterministic TOTPs for a fixed timestamp", () => {
    expect(generateTOTPs("secure!Charging!", 30, 12, null, 1718611200000)).toEqual({
      previous:       "QT1cCdKsIb9e",
      current:        "akF3c7qY2uiu",
      next:           "1U70OgaBA48M",
      remainingTime:   30
    });
  });

  it("generates TOTP codes for the given timestamp correctly", () => {
    expect(generateTOTPs("secure!Charging!", null, null, null, Date.UTC(2024, 4, 23, 0, 23, 5))).toEqual({
      previous:       "MdPU0jCm5tXz",
      current:        "CN63y502maVh",
      next:           "dI54vnA25m2h",
      remainingTime:   25
    });
  });

  it("generates TOTP codes with the given length correctly", () => {
    expect(generateTOTPs("secure!Charging!", null, 23, null, Date.UTC(2024, 4, 23, 0, 23, 5))).toEqual({
      previous:       "MdPU0jCm5tXzkaPrPj61KwI",
      current:        "CN63y502maVhAsv27Sd7JlE",
      next:           "dI54vnA25m2hWW3bUcdY13q",
      remainingTime:   25
    });
  });

  it("generates TOTP codes with the given alphabet correctly", () => {
    expect(generateTOTPs("secure!Charging!", null, null, "0123456789", Date.UTC(2024, 4, 23, 0, 23, 5))).toEqual({
      previous:       "233045043555",
      current:        "894361286613",
      next:           "545817627227",
      remainingTime:   25
    });
  });

  it("generates TOTP codes with the given validity time correctly", () => {
    expect(generateTOTPs("secure!Charging!", 60, null, null, Date.UTC(2024, 4, 23, 0, 23, 5))).toEqual({
      previous:       "nTdkiuG6yUyg",
      current:        "XJZr0L1DGKn0",
      next:           "ft0ONZ62MdMj",
      remainingTime:   55
    });
  });

});


describe("Object API", () => {

  it("supports the options object API", () => {
    expect(
      generateTOTPs({
        sharedSecret:  "secure!Charging!",
        validityTime:   30,
        totpLength:     6,
        alphabet:      "0123456789",
        timestamp:      new Date(1718611200000)
      }).current
    ).toBe("441749");
  });

});
