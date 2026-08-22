/*
 * Smoke test for the COMPILED output in dist/ — run by the node18-smoke job
 * in .github/workflows/ci.yml on the oldest Node this package claims to
 * support ("engines": { "node": ">=18" }). vitest 4 cannot run on Node 18
 * any more, so this file is what keeps that claim tested: plain Node, no
 * test runner, no dependencies.
 *
 * The vector is the same fixed-timestamp vector the vitest suite pins in
 * test/index.test.ts — if the two ever disagree, trust neither and look at
 * the code. Run from the repository root, after "npm run build":
 *
 *     node test/smoke.mjs
 */

import { generateTOTPs } from "../dist/index.js";

const totps    = generateTOTPs("secure!Charging!", 30, 12, null, 1718611200000);

const expected = {
    previous:       "QT1cCdKsIb9e",
    current:        "akF3c7qY2uiu",
    next:           "1U70OgaBA48M",
    remainingTime:   30
};

for (const key of Object.keys(expected)) {
    if (totps[key] !== expected[key]) {
        console.error(`Smoke test FAILED on Node ${process.version}: ${key} was "${totps[key]}", expected "${expected[key]}"!`);
        process.exit(1);
    }
}

console.log(`Smoke test passed on Node ${process.version}: ${totps.current}`);
