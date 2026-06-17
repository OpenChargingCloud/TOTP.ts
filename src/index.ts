/*
 * Copyright (c) 2024-2026 GraphDefined GmbH <achim.friedland@graphdefined.com>
 * This file is part of DynamicQRCodes <https://github.com/OpenChargingCloud/DynamicQRCodes>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import crypto from "node:crypto";

const DEFAULT_VALIDITY_TIME  = 30;
const DEFAULT_TOTP_LENGTH    = 12;
const DEFAULT_ALPHABET       = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_HASH_ALGORITHM = "sha256";

export type TOTPHashAlgorithm = "sha256" | "sha384" | "sha512";

export interface GenerateTOTPOptions {
    sharedSecret:    string;
    validityTime?:   number | null;
    totpLength?:     number | null;
    alphabet?:       string | null;
    timestamp?:      Date   | number | null;
    hashAlgorithm?:  TOTPHashAlgorithm | null;
}

export interface TOTPResult {
    previous:       string;
    current:        string;
    next:           string;
    remainingTime:  number;
}

function calcTOTPSlot(slotBytes:      Buffer,
                      totpLength:     number,
                      alphabet:       string,
                      sharedSecret:   string,
                      hashAlgorithm:  TOTPHashAlgorithm): string {

    const hmac = crypto.createHmac(hashAlgorithm, Buffer.from(sharedSecret, "utf-8"));
    const currentHash = hmac.update(slotBytes).digest();
    const offset = currentHash[currentHash.length - 1] & 0x0F;

    let result = "";
    for (let i = 0; i < totpLength; i++)
        result += alphabet[currentHash[(offset + i) % currentHash.length] % alphabet.length];

    return result;

}

function normalizeTimestamp(timestamp: Date | number | null | undefined): number {

    if (timestamp === null || timestamp === undefined)
        return Date.now();

    if (timestamp instanceof Date)
        return timestamp.getTime();

    return timestamp;

}

export function generateTOTPs(options:                GenerateTOTPOptions): TOTPResult;

export function generateTOTPs(sharedSecret:           string,
                              validityTime?:          number | null,
                              totpLength?:            number | null,
                              alphabet?:              string | null,
                              timestamp?:             Date   | number | null,
                              hashAlgorithm?:         TOTPHashAlgorithm | null): TOTPResult;

export function generateTOTPs(sharedSecretOrOptions:  string | GenerateTOTPOptions,
                              validityTime:           number | null = null,
                              totpLength:             number | null = null,
                              alphabet:               string | null = null,
                              timestamp:              Date   | number | null = null,
                              hashAlgorithm:          TOTPHashAlgorithm | null = null): TOTPResult {

    const options                 = typeof sharedSecretOrOptions === "string"
                                        ? {
                                              sharedSecret: sharedSecretOrOptions,
                                              validityTime,
                                              totpLength,
                                              alphabet,
                                              timestamp,
                                              hashAlgorithm
                                          }
                                        : sharedSecretOrOptions;

    const normalizedValidityTime  =  options.validityTime ?? DEFAULT_VALIDITY_TIME;
    const normalizedTOTPLength    =  options.totpLength   ?? DEFAULT_TOTP_LENGTH;
    const normalizedTimestamp     =  normalizeTimestamp(options.timestamp);
    const normalizedHashAlgorithm =  options.hashAlgorithm ?? DEFAULT_HASH_ALGORITHM;

    const sharedSecret            =  options.sharedSecret?.trim();
    const normalizedAlphabet      = (options.alphabet     ?? DEFAULT_ALPHABET).trim();

    if (!sharedSecret)
        throw new Error("The given shared secret must not be null or empty!");

    if (/\s/.test(sharedSecret))
        throw new Error("The given shared secret must not contain any whitespace characters!");

    if (sharedSecret.length < 16)
        throw new Error("The length of the given shared secret must be at least 16 characters!");

    if (!Number.isInteger(normalizedValidityTime) || normalizedValidityTime <= 0)
        throw new Error("The validity time must be a positive integer number of seconds!");

    if (!Number.isInteger(normalizedTOTPLength) || normalizedTOTPLength < 4 || normalizedTOTPLength > 255)
        throw new Error("The expected length of the TOTP must be between 4 and 255 characters!");

    if (!Number.isFinite(normalizedTimestamp) || normalizedTimestamp < 0)
        throw new Error("The timestamp must be a non-negative Unix timestamp in milliseconds!");

    if (!["sha256", "sha384", "sha512"].includes(normalizedHashAlgorithm))
        throw new Error("The hash algorithm must be one of: sha256, sha384, sha512!");

    if (!normalizedAlphabet)
        throw new Error("The given alphabet must not be null or empty!");

    if (normalizedAlphabet.length < 4)
        throw new Error("The given alphabet must contain at least 4 characters!");

    if (new Set(normalizedAlphabet).size !== normalizedAlphabet.length)
        throw new Error("The given alphabet must not contain duplicate characters!");

    if (/\s/.test(normalizedAlphabet))
        throw new Error("The given alphabet must not contain any whitespace characters!");

    const currentUnixTime    = Math.floor(normalizedTimestamp / 1000);
    const currentSlot        = BigInt(Math.floor(currentUnixTime / normalizedValidityTime));
    const remainingTime      = normalizedValidityTime - (currentUnixTime % normalizedValidityTime);

    const previousSlotBytes  = Buffer.alloc(8);
    const currentSlotBytes   = Buffer.alloc(8);
    const nextSlotBytes      = Buffer.alloc(8);

    previousSlotBytes.writeBigUInt64BE(currentSlot - BigInt(1));
    currentSlotBytes. writeBigUInt64BE(currentSlot);
    nextSlotBytes.    writeBigUInt64BE(currentSlot + BigInt(1));

    return {
        previous:  calcTOTPSlot(previousSlotBytes, normalizedTOTPLength, normalizedAlphabet, sharedSecret, normalizedHashAlgorithm),
        current:   calcTOTPSlot(currentSlotBytes,  normalizedTOTPLength, normalizedAlphabet, sharedSecret, normalizedHashAlgorithm),
        next:      calcTOTPSlot(nextSlotBytes,     normalizedTOTPLength, normalizedAlphabet, sharedSecret, normalizedHashAlgorithm),
        remainingTime
    };

}
