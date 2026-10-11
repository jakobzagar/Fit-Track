import {readFileSync} from "node:fs";
import {join} from "node:path";

const releaseTag = process.argv[2] ?? "";
if (!/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(releaseTag)) {
    console.error("Release tag must use the vMAJOR.MINOR.PATCH format");
    process.exit(1);
}

const root = process.env.RELEASE_ROOT ?? process.cwd();
const expectedVersion = releaseTag.slice(1);
const readJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), "utf8"));

const checkVersion = (label, actualVersion) => {
    if (actualVersion !== expectedVersion) {
        console.error(
            `${label} is ${JSON.stringify(actualVersion)}, expected ${JSON.stringify(expectedVersion)}`,
        );
        process.exit(1);
    }
};

for (const path of [
    "package.json",
    "backend/package.json",
    "frontend/package.json",
    "shared/package.json",
]) {
    checkVersion(path, readJson(path).version);
}

const lockfile = readJson("package-lock.json");
checkVersion("package-lock.json root version", lockfile.version);
for (const workspace of ["", "backend", "frontend", "shared"]) {
    checkVersion(
        `package-lock.json packages[${JSON.stringify(workspace)}]`,
        lockfile.packages?.[workspace]?.version,
    );
}

const manifest = readJson(".github/release-please/manifest.json");
checkVersion(".github/release-please/manifest.json entry for .", manifest["."]);

console.log(`version=${expectedVersion}`);
