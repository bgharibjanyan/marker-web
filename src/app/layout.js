import "@/app/global.scss";
import "swagger-ui-react/swagger-ui.css";

export const metadata = {
    title: "Marker",
    icons: {
        icon: "/images/logo/logo.svg",
    },
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body>
        {children}
        </body>
        </html>
    );
}
