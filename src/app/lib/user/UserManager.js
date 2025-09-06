import api from "@/app/lib/api/axios";

const UserManager = {
    user: null,

    async getUser() {
        console.log(this.user, "on init");

        // return cached user if already loaded
        if (this.user) return this.user;

        const token = localStorage.getItem("marker_im_token");
        if (!token) return null;

        try {
            const response = await api.get("/user/get-user", {
                headers: { imtoken: token },
            });

            this.user = response.data.user || null;
            console.log(this.user, "fetched user");

            return this.user;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("marker_im_token");
            }
            console.error("Failed to fetch user:", error);
            return null;
        }
    },
};

export default UserManager;
