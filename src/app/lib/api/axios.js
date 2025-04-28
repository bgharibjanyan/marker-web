import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("marker_im_token") : null;
        console.log(token);
        if (token) {
            config.headers.Authorization = token;
        }
        return config;
    },
    (error) => {
        if (error.response) {
            console.log(error.response);
        }
        Promise.reject(error)
    }
);



export default api;