import {requireUser} from "@/app/api/_auth/session";

export const getAuthenticatedTaskContext = async (request) => {
    const auth = await requireUser(request);
    if (auth.error) {
        return auth;
    }

    return {
        client: auth.client,
        db: auth.db,
        user: auth.user,
        userId: auth.userId,        usersCollection: auth.usersCollection,
        tasksCollection: auth.db.collection("tasks"),
        tagsCollection: auth.db.collection("tag"),
    };
};
