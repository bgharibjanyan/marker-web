export const withMongoTransaction = async (client, operation) => {
    const session = client.startSession();
    let result;

    try {
        await session.withTransaction(async () => {
            result = await operation(session);
        }, {
            readConcern: {level: "snapshot"},
            writeConcern: {w: "majority"},
            readPreference: "primary",
        });
        return result;
    } finally {
        await session.endSession();
    }
};
