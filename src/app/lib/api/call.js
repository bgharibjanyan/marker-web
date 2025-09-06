import {usePathname, useRouter} from "next/navigation";
import api from "@/app/lib/api/axios";

const useApiCall = () => {
    const router = useRouter();
    const pathname = usePathname();

    const call = async (method, url, data = null) => {
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
            if (error.response?.status === 401) {
                window.localStorage.removeItem("marker_im_token");
                router.replace("/");
            }
            return {
                success: false,
                error: error.response?.data || {message: "Unexpected error occurred"},
            };
        }
    };

    return call;
};


export default useApiCall;
