import {createSwaggerSpec} from "next-swagger-doc";
import openApiDefinition from "@/app/lib/swagger/openapi.json";

export const getApiDocs = async () => (
    createSwaggerSpec({
        apiFolder: "src/app/api",
        definition: openApiDefinition,
    })
);
