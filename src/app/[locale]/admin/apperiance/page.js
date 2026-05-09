import {redirect} from "next/navigation";

export default async function AdminApperianceAlias({params}) {
    const {locale} = await params;
    redirect(`/${locale}/admin/appearance`);
}
