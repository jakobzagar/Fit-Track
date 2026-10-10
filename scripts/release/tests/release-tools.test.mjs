import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import test from "node:test";

const repository = fileURLToPath(new URL("../../../", import.meta.url));
const backendDigest = `sha256:${"a".repeat(64)}`;
const migrationDigest = `sha256:${"b".repeat(64)}`;

// Replace external commands at the CLI boundary; run the real Bash scripts.
const mock = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const tool = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const scenario = process.env.SCENARIO;
const root = process.env.FIXTURE;
const emit = value => console.log(typeof value === 'string' ? value : JSON.stringify(value));
const calls = path.join(root, 'calls.jsonl');
fs.appendFileSync(calls, JSON.stringify({tool,args}) + '\\n');
if (tool === 'sleep') process.exit(0);
if (tool === 'gh') {
    if (!args[1].includes('head_sha=release-commit&branch=main')) process.exit(2);
    if (scenario === 'api-error') process.exit(1);
    if (scenario === 'timeout') emit({workflow_runs:[]});
    else if (['failed','cancelled'].includes(scenario)) {
        emit({workflow_runs:[{head_sha:'release-commit',status:'completed',conclusion:scenario === 'failed' ? 'failure' : 'cancelled'}]});
    } else {
        const poll = path.join(root,'poll');
        const sha = fs.existsSync(poll) ? 'release-commit' : 'other-commit';
        fs.writeFileSync(poll,'');
        emit({workflow_runs:[{head_sha:sha,status:'completed',conclusion:'success'}]});
    }
} else if (tool === 'aws') {
    if (scenario === 'aws-error') process.exit(1);
    const name = args[args.indexOf('--repository-name') + 1];
    const digest = name.includes('backend') ? process.env.BACKEND_DIGEST : process.env.MIGRATION_DIGEST;
    if (args.includes('--image-ids')) emit(scenario === 'mismatch' ? 'sha256:bad' : digest);
    else if (scenario === 'retry' || scenario === 'conflict') {
        emit({imageDetails:[{imageTags:['1.2.3'],imageDigest:scenario === 'conflict' ? 'sha256:bad' : digest}]});
    } else emit({imageDetails:[{imageTags:['older-release'],imageDigest:'sha256:old'},{imageDigest:'sha256:untagged'}]});
} else if (tool === 'docker') {
    const statePath = path.join(root,'tags.json');
    const tags = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath,'utf8')) : {};
    if (args[2] === 'inspect') {
        const ref = args[3];
        if (scenario === 'promotion-conflict' && ref === 'ghcr.io/example/migration:1.2.3') {
            emit('Digest: sha256:' + '0'.repeat(64));
        } else if (ref.includes(':sha-release-commit')) {
            if (scenario === 'missing-image') process.exit(1);
            emit('Digest: ' + (scenario === 'invalid-digest' ? 'invalid' : process.env.BACKEND_DIGEST));
        } else {
            if (!tags[ref]) process.exit(1);
            emit('Digest: ' + tags[ref]);
        }
    } else if (args[2] === 'create') {
        if (scenario === 'copy-error') process.exit(1);
        const source = args.at(-1);
        for (let i = 3; i < args.length - 1; i++) {
            if (args[i] === '--tag') tags[args[++i]] = source.split('@')[1];
        }
        fs.writeFileSync(statePath,JSON.stringify(tags));
    } else process.exit(2);
} else process.exit(2);
`;

function fixture(t, scenario = "success") {
    const root = mkdtempSync(join(tmpdir(), "fit-track-release-"));
    t.after(() => rmSync(root, {recursive: true, force: true}));
    const bin = join(root, "bin");
    mkdirSync(bin);
    for (const tool of ["aws", "gh", "docker", "sleep"]) {
        writeFileSync(join(bin, tool), mock, {mode: 0o755});
    }
    const writeJson = (name, value) => {
        const target = join(root, name);
        mkdirSync(join(target, ".."), {recursive: true});
        writeFileSync(target, JSON.stringify(value));
    };
    const packages = {};
    for (const workspace of ["", "backend", "frontend", "shared"]) {
        writeJson(join(workspace, "package.json"), {name: "fixture", version: "1.2.3"});
        packages[workspace] = {version: "1.2.3"};
    }
    writeJson("package-lock.json", {version: "1.2.3", packages});
    writeJson(".github/release-please/manifest.json", {".": "1.2.3"});
    const read = (name) =>
        existsSync(join(root, name)) ? readFileSync(join(root, name), "utf8") : "";
    return {
        writeJson,
        read,
        tags: () => JSON.parse(read("tags.json") || "{}"),
        calls: () => read("calls.jsonl").trim().split("\n").filter(Boolean).map(JSON.parse),
        run: (script, ...args) =>
            spawnSync("bash", [join(repository, "scripts/release", script), ...args], {
                cwd: root,
                encoding: "utf8",
                env: {
                    ...process.env,
                    PATH: `${bin}:${process.env.PATH}`,
                    FIXTURE: root,
                    SCENARIO: scenario,
                    RELEASE_ROOT: root,
                    GITHUB_REPOSITORY: "example/project",
                    GITHUB_SHA: "release-commit",
                    GITHUB_REPOSITORY_OWNER: "Example",
                    REGISTRY: "ghcr.io",
                    AWS_REGION: "eu-central-1",
                    ECR_REGISTRY: "example.ecr",
                    VERSION: "1.2.3",
                    BACKEND_DIGEST: backendDigest,
                    MIGRATION_DIGEST: migrationDigest,
                    GITHUB_OUTPUT: join(root, "outputs"),
                    GITHUB_STEP_SUMMARY: join(root, "summary"),
                },
            }),
    };
}

function failed(result, message) {
    assert.notEqual(result.status, 0, "Expected the script to fail");
    if (message) assert.ok(result.stderr.includes(message), result.stderr);
}

const copies = (f) =>
    f.calls().filter((call) => call.tool === "docker" && call.args[2] === "create");

test("validates coordinated release versions", (t) => {
    const result = fixture(t).run("validate.sh", "v1.2.3");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "version=1.2.3\n");
});

for (const tag of ["1.2.3", "fit-track-v1.2.3"]) {
    test(`rejects invalid release tag ${tag}`, (t) => {
        failed(
            fixture(t).run("validate.sh", tag),
            "Release tag must use the vMAJOR.MINOR.PATCH format",
        );
    });
}

for (const [name, value, message] of [
    ["backend/package.json", {version: "9.9.9"}, 'backend/package.json is "9.9.9"'],
    [
        ".github/release-please/manifest.json",
        {".": "9.9.9"},
        'manifest.json entry for . is "9.9.9"',
    ],
    [
        "package-lock.json",
        {version: "1.2.3", packages: {"": {version: "1.2.3"}, backend: {version: "9.9.9"}}},
        'packages["backend"] is "9.9.9"',
    ],
]) {
    test(`rejects version mismatch in ${name}`, (t) => {
        const f = fixture(t);
        f.writeJson(name, value);
        failed(f.run("validate.sh", "v1.2.3"), message);
    });
}

test("Release Please and workflow use the same tag format", () => {
    const config = JSON.parse(
        readFileSync(join(repository, ".github/release-please/config.json"), "utf8"),
    );
    assert.equal(config["include-component-in-tag"], false);
    assert.ok(
        readFileSync(join(repository, ".github/workflows/release.yaml"), "utf8").includes(
            '- "v*.*.*"',
        ),
    );
});

test("promotes exact images and safely refreshes tags on retry", (t) => {
    const f = fixture(t);
    const ref = `ghcr.io/example/backend@${backendDigest}`;
    for (let attempt = 0; attempt < 2; attempt++) {
        const result = f.run("promote-images.sh", "1.2.3", ref);
        assert.equal(result.status, 0, result.stderr);
        assert.equal(f.tags()["ghcr.io/example/backend:1.2.3"], backendDigest);
        assert.equal(f.tags()["ghcr.io/example/backend:latest"], backendDigest);
    }
    assert.equal(copies(f).length, 2);
});

test("rejects mutable source tags", (t) => {
    const f = fixture(t);
    failed(
        f.run("promote-images.sh", "1.2.3", "ghcr.io/example/backend:main"),
        "Image must use an exact sha256 digest",
    );
    assert.equal(copies(f).length, 0);
});

test("checks every release tag before starting promotion", (t) => {
    const f = fixture(t, "promotion-conflict");
    const refs = ["backend", "frontend", "migration"].map(
        (name) => `ghcr.io/example/${name}@${backendDigest}`,
    );
    failed(
        f.run("promote-images.sh", "1.2.3", ...refs),
        "Release tag already points to a different image",
    );
    assert.equal(copies(f).length, 0);
});

test("waits for the exact commit and resolves all three images", (t) => {
    const f = fixture(t);
    const result = f.run("wait-for-images.sh");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
        f.read("outputs"),
        ["backend", "frontend", "migration"]
            .map((name) => `${name}-digest=${backendDigest}\n`)
            .join(""),
    );
    assert.equal(f.calls().filter((call) => call.tool === "gh").length, 2);
});

for (const scenario of [
    "failed",
    "cancelled",
    "timeout",
    "api-error",
    "missing-image",
    "invalid-digest",
]) {
    test(`image resolution rejects ${scenario}`, (t) => {
        const f = fixture(t, scenario);
        const message = ["failed", "cancelled"].includes(scenario)
            ? "Main image publication did not succeed"
            : scenario === "timeout"
              ? "Timed out waiting"
              : undefined;
        failed(f.run("wait-for-images.sh"), message);
        assert.equal(f.read("outputs"), "");
    });
}

test("copies backend and migration to ECR and records exact references", (t) => {
    const f = fixture(t);
    const result = f.run("copy-images-to-ecr.sh");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(copies(f).length, 2);
    assert.equal(
        f.read("outputs"),
        `backend-ref=example.ecr/fit-track-prod-backend-eu-central-1@${backendDigest}\nmigration-ref=example.ecr/fit-track-prod-migration-eu-central-1@${migrationDigest}\n`,
    );
});

test("reuses matching immutable ECR tags without copying", (t) => {
    const f = fixture(t, "retry");
    const result = f.run("copy-images-to-ecr.sh");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(copies(f).length, 0);
});

for (const scenario of ["conflict", "mismatch", "aws-error", "copy-error"]) {
    test(`ECR publication rejects ${scenario}`, (t) => {
        const f = fixture(t, scenario);
        const message =
            scenario === "conflict"
                ? "already points to different content"
                : scenario === "mismatch"
                  ? "ECR digest mismatch"
                  : undefined;
        failed(f.run("copy-images-to-ecr.sh"), message);
        assert.equal(f.read("outputs"), "");
        if (scenario === "conflict") assert.equal(copies(f).length, 0);
    });
}
