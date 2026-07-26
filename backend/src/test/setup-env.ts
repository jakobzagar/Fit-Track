if (process.env.NODE_ENV !== "test") {
    throw new Error("Backend tests must run with NODE_ENV=test.");
}
