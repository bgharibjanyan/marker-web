import api from "@/app/lib/api/axios";

const UserManager = {
    user: null,
    pendingRequest: null,

    setUser(user) {
        this.user = user || null;
        return this.user;
    },

    clear() {
        this.user = null;
        this.pendingRequest = null;
    },

    async getUser({refresh = false} = {}) {
        if (this.user && !refresh) return this.user;
        if (this.pendingRequest && !refresh) return this.pendingRequest;

        this.pendingRequest = api.get("/user/get-user")
            .then((response) => {
                this.user = response.data.user || null;
                return this.user;
            })
            .catch((error) => {
                if (error.response?.status !== 401) console.error("Failed to fetch user:", error);
                this.user = null;
                return null;
            })
            .finally(() => {
                this.pendingRequest = null;
            });

        return this.pendingRequest;
    },
};
export default UserManager;
