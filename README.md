# @open-charging-cloud/totp

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
  timestamp:      Date.now()
});
```

## API

### `generateTOTPs(sharedSecret, validityTime, totpLength, alphabet, timestamp)`

Generates TOTP values for the previous, current, and next time slot.

Parameters:

| Parameter | Description | Default |
| --- | --- | --- |
| `sharedSecret` | Shared secret string, at least 16 characters, without whitespace. | Required |
| `validityTime` | Slot duration in seconds. | `30` |
| `totpLength` | Generated token length. | `12` |
| `alphabet` | Alphabet used for token characters. | Digits, lowercase letters, and uppercase letters |
| `timestamp` | Unix timestamp in milliseconds or `Date`. | `Date.now()` |

Returns:

```ts
{
  previous:       string;
  current:        string;
  next:           string;
  remainingTime:  number;
}
```

## Development

```sh
npm install
npm test
```
