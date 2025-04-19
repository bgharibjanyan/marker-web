import api from "@/app/lib/api/axios";

export const apiCall = async (method, url, data = null) => {
    try {
        const response = await api({
            method,
            url,
            data,
        });

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        console.error("API Request Error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || { message: "Unexpected error occurred" },
        };
    }
};
