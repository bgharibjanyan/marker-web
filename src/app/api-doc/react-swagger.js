"use client";

import SwaggerUI from "swagger-ui-react";

export default function ReactSwagger({spec}) {
    return (
        <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            displayRequestDuration
            persistAuthorization
        />
    );
}
