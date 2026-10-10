import assert from "node:assert/strict";
import {mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import test from "node:test";

const directory = fileURLToPath(new URL("../", import.meta.url));
const digest = `sha256:${"a".repeat(64)}`;
const oldDigest = `sha256:${"b".repeat(64)}`;

// The scripts run unchanged against a stateful AWS CLI boundary.
const mock = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const operation = args.slice(0, 2).join(' ');
const value = key => args[args.indexOf(key) + 1];
const state = JSON.parse(fs.readFileSync(process.env.STATE, 'utf8'));
const emit = data => process.stdout.write(JSON.stringify(data));
const output = (OutputKey, OutputValue) => ({OutputKey, OutputValue});
fs.appendFileSync(process.env.CALLS, JSON.stringify(args) + '\\n');
if (state.scenario === 'api-error') process.exit(1);
const service = {status:'ACTIVE', desiredCount:1, runningCount:1, pendingCount:0,
  networkConfiguration:{awsvpcConfiguration:{subnets:['subnet-private'],securityGroups:['sg-task'],assignPublicIp:'DISABLED'}},
  taskDefinition:state.scenario === 'rollback' ? 'backend:old' : 'backend:new',
  deployments:[{taskDefinition:'backend:new', rolloutState:'COMPLETED'}]};
if (state.scenario === 'capacity-drift') service.desiredCount = 2;
if (state.scenario === 'unhealthy') service.runningCount = 0;
switch (operation) {
case 'cloudformation describe-stacks': {
 const name = value('--stack-name');
 const stack = {StackStatus:state.scenario === 'busy' ? 'UPDATE_IN_PROGRESS' : 'UPDATE_COMPLETE',
  Parameters:Object.entries(state.parameters).map(([ParameterKey,ParameterValue])=>({ParameterKey,ParameterValue})),
  Outputs:name.endsWith('service') ? [output('BackendServiceArn','service'), output('BackendTaskDefinitionArn','backend:new'), output('MigrationTaskDefinitionArn','migration:new'), output('BackendTaskSecurityGroupId','sg-task')] :
   name.endsWith('compute') ? [output('EcsClusterArn','cluster')] : [output('AppSubnetAz1Id','subnet-private')]};
 emit({Stacks:[stack]}); break;
}
case 'ecs describe-services': emit({failures:[],services:[service]}); break;
case 'cloudformation create-change-set':
 if (state.scenario==='busy') process.exit(1);
 if (!args.includes('--use-previous-template') || value('--role-arn') !== 'cfn-role') process.exit(2);
 state.request = JSON.parse(value('--parameters')); emit({Id:'changeset'}); break;
case 'cloudformation describe-change-set': {
 const migration = state.request.some(p=>p.ParameterKey==='MigrationImageDigest' && p.ParameterValue);
 const resource = migration ? 'MigrationTaskDefinition' : 'BackendTaskDefinition';
 const changes = [{Type:'Resource',ResourceChange:{Action:'Modify',LogicalResourceId:resource,ResourceType:'AWS::ECS::TaskDefinition',Replacement:'True'}}];
 if (state.scenario==='noop') emit({Status:'FAILED',StatusReason:"The submitted information didn't contain changes."});
 else if (state.scenario==='change-failed') emit({Status:'FAILED',StatusReason:'Permission denied'});
 else emit({Status:'CREATE_COMPLETE',ExecutionStatus:'AVAILABLE',Changes:changes}); break;
}
case 'cloudformation execute-change-set':
 for (const p of state.request) if (p.ParameterValue) state.parameters[p.ParameterKey]=p.ParameterValue;
 emit({}); break;
case 'cloudformation delete-change-set': emit({}); break;
case 'cloudformation wait':
 if (state.scenario==='stack-failed' || (args.includes('change-set-create-complete') && ['change-failed','noop'].includes(state.scenario))) process.exit(1); emit({}); break;
case 'ecs run-task':
 if (JSON.parse(value('--network-configuration')).awsvpcConfiguration.assignPublicIp !== 'DISABLED') process.exit(2);
 emit(state.scenario==='run-failed' ? {failures:[{reason:'capacity'}],tasks:[]} : {failures:[],tasks:[{taskArn:'task'}]}); break;
case 'ecs wait':
 if (state.scenario==='wait-failed' || (args.includes('services-stable') && state.scenario==='unhealthy')) process.exit(1); emit({}); break;
case 'ecs describe-tasks':
 emit({failures:[],tasks:[{lastStatus:'STOPPED',taskDefinitionArn:'migration:new',containers:[{name:'migration', ...(state.scenario==='no-exit' ? {} : {exitCode:state.scenario==='migration-failed' ? 1 : 0})}]}]}); break;
default: process.stderr.write('Unexpected operation '+operation); process.exit(2);
}
fs.writeFileSync(process.env.STATE, JSON.stringify(state));
`;

function fixture(scenario, parameters = {}) {
    const root = mkdtempSync(join(tmpdir(), "fit-track-deploy-"));
    const statePath = join(root, "state.json");
    const callsPath = join(root, "calls.jsonl");
    writeFileSync(join(root, "aws"), mock, {mode: 0o755});
    writeFileSync(
        statePath,
        JSON.stringify({
            scenario,
            parameters: {
                BackendDesiredCount: "1",
                BackendImageDigest: oldDigest,
                MigrationImageDigest: oldDigest,
                ClientOrigin: "https://example.test",
                ...parameters,
            },
        }),
    );
    const env = {
        ...process.env,
        PATH: `${root}:${process.env.PATH}`,
        STATE: statePath,
        CALLS: callsPath,
        AWS_REGION: "eu-central-1",
        CFN_SERVICE_ROLE_ARN: "cfn-role",
        BACKEND_DIGEST: digest,
        MIGRATION_DIGEST: digest,
    };
    return {
        run: (script, ...args) =>
            spawnSync("bash", [join(directory, script), ...args], {env, encoding: "utf8"}),
        state: () => JSON.parse(readFileSync(statePath, "utf8")),
        calls: () =>
            existsSync(callsPath)
                ? readFileSync(callsPath, "utf8").trim().split("\n").map(JSON.parse)
                : [],
        close: () => rmSync(root, {recursive: true, force: true}),
    };
}

for (const phase of ["migration", "backend"]) {
    test(`${phase} changes only its digest and preserves every other parameter`, () => {
        const f = fixture("success");
        try {
            const result = f.run("update-service-stack.sh", phase);
            assert.equal(result.status, 0, result.stderr);
            const key = phase === "migration" ? "MigrationImageDigest" : "BackendImageDigest";
            const request = f.state().request;
            assert.deepEqual(
                request.find((p) => p.ParameterKey === key),
                {ParameterKey: key, ParameterValue: digest},
            );
            assert.ok(
                request
                    .filter((p) => p.ParameterKey !== key)
                    .every((p) => p.UsePreviousValue === true && !("ParameterValue" in p)),
            );
            assert.equal(f.state().parameters[key], digest);
        } finally {
            f.close();
        }
    });
}

for (const scenario of ["capacity-drift", "busy", "change-failed", "api-error"]) {
    test(`rejects ${scenario} before change set execution`, () => {
        const f = fixture(scenario);
        try {
            assert.notEqual(f.run("update-service-stack.sh", "backend").status, 0);
            assert.ok(!f.calls().some((a) => a[1] === "execute-change-set"));
        } finally {
            f.close();
        }
    });
}

test("rejects zero bootstrap capacity before creating a change set", () => {
    const f = fixture("success", {BackendDesiredCount: "0"});
    try {
        assert.notEqual(f.run("update-service-stack.sh", "migration").status, 0);
        assert.ok(!f.calls().some((a) => a[1] === "create-change-set"));
    } finally {
        f.close();
    }
});

test("a no-op retry succeeds without execution", () => {
    const f = fixture("noop", {MigrationImageDigest: digest});
    try {
        assert.equal(f.run("update-service-stack.sh", "migration").status, 0);
        assert.ok(!f.calls().some((a) => a[1] === "create-change-set"));
    } finally {
        f.close();
    }
});

test("a failed change set cannot hide a different digest", () => {
    const f = fixture("noop");
    try {
        assert.notEqual(f.run("update-service-stack.sh", "migration").status, 0);
        assert.ok(!f.calls().some((a) => a[1] === "execute-change-set"));
    } finally {
        f.close();
    }
});

test("stack update failure stops the rollout", () => {
    const f = fixture("stack-failed");
    try {
        assert.notEqual(f.run("update-service-stack.sh", "backend").status, 0);
    } finally {
        f.close();
    }
});

for (const scenario of ["success", "run-failed", "wait-failed", "migration-failed", "no-exit"]) {
    test(`migration handles ${scenario}`, () => {
        const f = fixture(scenario, {MigrationImageDigest: digest});
        try {
            const result = f.run("run-migration.sh");
            assert.equal(result.status === 0, scenario === "success", result.stderr);
            if (scenario === "run-failed") assert.ok(!f.calls().some((a) => a[1] === "wait"));
        } finally {
            f.close();
        }
    });
}

test("wrong migration digest never launches a task", () => {
    const f = fixture("success");
    try {
        assert.notEqual(f.run("run-migration.sh").status, 0);
        assert.ok(!f.calls().some((a) => a[1] === "run-task"));
    } finally {
        f.close();
    }
});

for (const scenario of ["success", "rollback", "unhealthy", "wait-failed"]) {
    test(`backend verification handles ${scenario}`, () => {
        const f = fixture(scenario, {BackendImageDigest: digest});
        try {
            const result = f.run("verify-backend.sh");
            assert.equal(result.status === 0, scenario === "success", result.stderr);
        } finally {
            f.close();
        }
    });
}
