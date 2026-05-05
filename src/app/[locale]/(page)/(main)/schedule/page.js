import {getTranslations} from "next-intl/server";

export default async function Home() {
    const t = await getTranslations('Pages');

    return (
        <div>{t('schedule')}</div>
    );
}
