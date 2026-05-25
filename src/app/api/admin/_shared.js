export const ADMIN_AUTH_HEADER = "x-marker-admin-auth";
export const ADMIN_AUTH_VALUE = "authenticated";

export const isAdminRequest = (request) => (
    request.headers.get(ADMIN_AUTH_HEADER) === ADMIN_AUTH_VALUE
);
