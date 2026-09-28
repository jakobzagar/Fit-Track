# FitTrack AWS implementation status

This document records the AWS resources deployed for FitTrack. The [AWS architecture plan](aws-deployment-plan.md) describes the intended design; this file describes the deployed state.

## Current state

- **AWS access:** IAM user with administrator access
- **Network:** VPC, six subnets across two Availability Zones, route tables, and an Internet Gateway are reported as created. Resource IDs, CIDR assignments, route table associations, and routes have not been fully recorded or independently verified.

## AWS account access

An [IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html) is the identity used to sign in to and manage the AWS account. Its permissions are determined by attached [IAM policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html). The current IAM user has administrator access, but the policy or group granting it has not been recorded. This human account identity is separate from the [IAM roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html) used by application workloads.
