import {getApiDocs} from "@/app/lib/swagger";
import ReactSwagger from "./react-swagger";
import styles from "./page.module.scss";
import {notFound} from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApiDocPage() {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_API_DOCS !== "true") {
        notFound();
    }

    const spec = await getApiDocs();

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <h1>Marker API Docs</h1>
                <p>
                    Swagger UI generated from the Marker OpenAPI definition. Keep
                    src/app/lib/swagger/openapi.json updated when API routes change.
                </p>
            </header>
            <section className={styles.swaggerContainer}>
                <ReactSwagger spec={spec}/>
            </section>
        </main>
    );
}
