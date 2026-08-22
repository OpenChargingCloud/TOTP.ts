# @open-charging-cloud/totp

[![CI](https://github.com/OpenChargingCloud/TOTP.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenChargingCloud/TOTP.ts/actions/workflows/ci.yml)
[![Nightly](https://github.com/OpenChargingCloud/TOTP.ts/actions/workflows/nightly.yml/badge.svg)](https://github.com/OpenChargingCloud/TOTP.ts/actions/workflows/nightly.yml)
[![npm](https://img.shields.io/npm/v/%40open-charging-cloud%2Ftotp)](https://www.npmjs.com/package/@open-charging-cloud/totp)

TOTP is a TypeScript library for creating Time-based One-Time Passwords (TOTPs).

https://www.npmjs.com/package/@open-charging-cloud/totp

It can be used e.g. for Secure Dynamic QR-Codes in E-Mobility or a secure alternative for legacy HTTP BASIC Authentication mechanisms using `Authorization: TOTP <token> <totp>`.

## Installation

```sh
npm install @open-charging-cloud/totp
```

## Usage

```js
import { generateTOTPs } from "@open-charging-cloud/totp";

const totps = generateTOTPs("secure!Charging!");

console.log(totps.current);
console.log(totps.remainingTime);
```

You can also pass an options object:

```js
const totps = generateTOTPs({
  sharedSecret:  "secure!Charging!",
  validityTime:   30,
  totpLength:     12,
  alphabet:      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  timestamp:      Date.now(),
  hashAlgorithm: "sha256"
});
```

## API

### `generateTOTPs(sharedSecret, validityTime, totpLength, alphabet, timestamp, hashAlgorithm)`

Generates TOTP values for the previous, current, and next time slot.

Parameters:

| Parameter | Description | Default |
| --- | --- | --- |
| `sharedSecret` | Shared secret string, at least 16 characters, without whitespace. | Required |
| `validityTime` | Slot duration in seconds. | `30` |
| `totpLength` | Generated token length. | `12` |
| `alphabet` | Alphabet used for token characters. | Digits, lowercase letters, and uppercase letters |
| `timestamp` | Unix timestamp in milliseconds or `Date`. | `Date.now()` |
| `hashAlgorithm` | HMAC hash algorithm. Must be `sha256`, `sha384`, or `sha512`. | `sha256` |

Returns:

```ts
{
  previous:       string;
  current:        string;
  next:           string;
  remainingTime:  number;
}
```

## Security notes

The token format is shared with the C# `TOTPGenerator` in
[Vanaheimr Hermod](https://github.com/Vanaheimr/Hermod), which produces
byte-identical tokens for the same secret, time slot and alphabet (Hermod is
HMAC-SHA256 only so far; `sha384` and `sha512` are extensions of this
library). The format is therefore frozen: neither of the two quirks below can
be "fixed" here without breaking every deployed verifier. So they are
documented instead — with numbers, because the numbers are the interesting
part.

### Modulo bias

Each token character is chosen as `hashByte % alphabet.length`. Whenever the
alphabet length does not divide 256, the first `256 % length` characters of
the alphabet are reachable from one extra byte value: with the default
62-character alphabet, `256 = 4·62 + 8`, so its first eight characters
(`0`–`7`) each appear with probability 5/256 ≈ 1.953 %, the remaining 54 with
4/256 ≈ 1.563 % — a relative excess of 25 %, easily visible in a frequency
count over a few thousand tokens.

Per character this costs almost nothing in Shannon entropy (5.9497 bits
instead of log₂ 62 ≈ 5.9542), and noticeably more in min-entropy, the measure
a guessing attacker cares about: −log₂(5/256) ≈ 5.678 bits. A default
12-character token therefore carries ≈ 71.40 bits of Shannon entropy and
≈ 68.14 bits of min-entropy instead of the ideal 71.45 — the single most
likely token is about ten times more probable than under a perfectly uniform
draw, at (5/256)¹² ≈ 3.1·10⁻²¹, inside a 30-second validity window. For
calibration: a six-digit RFC 6238 code carries 19.93 bits, and RFC 4226's
dynamic truncation has a modulo bias of its own (2³¹ mod 10⁶ = 483 648, a
0.047 % excess for the residues below it). Ours is larger only because 256
and 62 are the same order of magnitude, while 2³¹ dwarfs 10⁶.

Choosing an alphabet whose length divides 256 removes the bias entirely, no
code change required: appending `-` and `_` to the default alphabet yields
the 64-character base64url character set, and `256 = 4·64` exactly. A
digits-only alphabet (`"0123456789"`) leans the other way: `256 = 25·10 + 6`,
so `0`–`5` are 4 % more likely than `6`–`9`.

### Token length vs. hash length

Characters are read from the HMAC output at index `(offset + i) % hashLength`
— the hash is a ring buffer. Position `i + hashLength` therefore always
repeats position `i`, and a token longer than the hash simply starts over:

```js
generateTOTPs("secure!Charging!", 30, 64, null, 1718611200000).current
// "akF3c7qY2uiuO4rpyU0SC0W8VFE6nvxz" + "akF3c7qY2uiuO4rpyU0SC0W8VFE6nvxz"
//  — the 32-character sha256 token, twice.
```

Entropy stops growing at `hashLength` characters:

| `hashAlgorithm` | Hash bytes | Longest useful token | Min-entropy at that length (default alphabet) |
| --- | --- | --- | --- |
| `sha256` | 32 | 32 characters | ≈ 181.7 bits |
| `sha384` | 48 | 48 characters | ≈ 272.5 bits |
| `sha512` | 64 | 64 characters | ≈ 363.4 bits |

`totpLength` still accepts up to 255 — the bound is part of the shared format
contract, and the C# implementation cycles identically — but characters
beyond the hash length add no security, and the visible period incidentally
reveals which hash algorithm produced the token. If you need a longer token,
pick a longer hash, not a longer `totpLength`.

## Development

```sh
npm install
npm test
```
