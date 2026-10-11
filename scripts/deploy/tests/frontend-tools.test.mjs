import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import test from "node:test";

const script = fileURLToPath(new URL("../deploy-frontend.sh", import.meta.url));

// Exercise the real script without AWS credentials or uploads.
const mock = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const tool = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const operation = tool + ' ' + args.slice(0, tool === 'aws' ? 2 : 1).join(' ');
fs.appendFileSync(process.env.CALLS, JSON.stringify({tool,args})+'\\n');
if (operation === process.env.FAIL_OPERATION) process.exit(1);
if (operation === 'aws cloudformation describe-stacks') {
    console.log(JSON.stringify({Stacks:[{Outputs:[
        {OutputKey:'FrontendBucketName',OutputValue:'frontend-bucket'},
        {OutputKey:'CfDistributionId',OutputValue:'distribution'}
    ]}]}));
} else if (['aws s3 cp','aws s3 sync'].includes(operation)) {
    const isIndex = args[2].endsWith('index.html');
    if (isIndex && process.env.FAIL_OPERATION === 'entry-upload') process.exit(1);
    if (!fs.existsSync(args[2])) process.exit(2);
} else if (operation === 'aws cloudfront create-invalidation') {
    console.log(JSON.stringify({Invalidation:{Id:'invalidation'}}));
} else if (operation !== 'aws cloudfront wait') process.exit(2);
`;

function fixture(t, failure = "") {
    const root = mkdtempSync(join(tmpdir(), "fit-track-frontend-"));
    t.after(() => rmSync(root, {recursive: true, force: true}));
    const log = join(root, "calls.jsonl");
    writeFileSync(join(root, "aws"), mock, {mode: 0o755});
    mkdirSync(join(root, "frontend/dist/assets"), {recursive: true});
    writeFileSync(
        join(root, "frontend/dist/index.html"),
        '<script src="/assets/app-hash.js"></script>',
    );
    writeFileSync(join(root, "frontend/dist/assets/app-hash.js"), "application");
    const result = spawnSync("bash", [script], {
        cwd: root,
        encoding: "utf8",
        env: {
            ...process.env,
            PATH: `${root}:${process.env.PATH}`,
            CALLS: log,
            FAIL_OPERATION: failure,
            AWS_REGION: "eu-central-1",
        },
    });
    const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    return {result, calls};
}

test("syncs the built frontend before index and waits for invalidation", (t) => {
    const {result, calls} = fixture(t);
    assert.equal(result.status, 0, result.stderr);
    const uploads = calls.filter((call) => call.tool === "aws" && call.args[0] === "s3");
    assert.equal(uploads.length, 2);
    assert.equal(uploads[0].args[3], "s3://frontend-bucket/");
    assert.equal(uploads[0].args[1], "sync");
    assert.equal(uploads[0].args[2], "frontend/dist/");
    assert.equal(uploads[0].args[uploads[0].args.indexOf("--exclude") + 1], "index.html");
    assert.equal(uploads[1].args[3], "s3://frontend-bucket/index.html");
    assert.ok(uploads.every((call) => !call.args.includes("--delete")));
    const cf = calls.filter((call) => call.tool === "aws" && call.args[0] === "cloudfront");
    assert.equal(cf[0].args[1], "create-invalidation");
    assert.equal(cf[0].args[cf[0].args.indexOf("--paths") + 1], "/*");
    assert.equal(cf[1].args[1], "wait");
    assert.equal(cf[1].args[cf[1].args.indexOf("--id") + 1], "invalidation");
    assert.ok(calls.indexOf(uploads[1]) < calls.indexOf(cf[0]));
});

for (const failure of [
    "aws cloudformation describe-stacks",
    "aws s3 sync",
    "entry-upload",
    "aws cloudfront create-invalidation",
    "aws cloudfront wait",
]) {
    test(`frontend deploy stops on ${failure}`, (t) => {
        const {result, calls} = fixture(t, failure);
        assert.notEqual(result.status, 0);
        if (["aws s3 sync", "entry-upload"].includes(failure)) {
            assert.ok(!calls.some((call) => call.tool === "aws" && call.args[0] === "cloudfront"));
        }
        if (failure === "aws s3 sync") {
            assert.equal(
                calls.filter((call) => call.tool === "aws" && call.args[0] === "s3").length,
                1,
            );
        }
    });
}
