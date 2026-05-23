import styles from "./SchaduleGlobalInfo.module.scss";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

export default function SchaduleGlobalInfo({
                                               totalTasks,
                                               todayTasksCount,
                                               repeatingTasksCount,
                                               privateTasksCount,
                                               onCreateTask,
                                               t,
                                           }) {
    return (
        <>
            <div className={styles.scheduleHeader}>
                <div>
                    <span className={`${styles.eyebrow} ${styles.t6}`}>{t("eyebrow")}</span>
                    <h1 className={`${styles.title} ${styles.t3}`}>{t("title")}</h1>
                </div>

                <Button
                    type="primary"
                    text={t("actions.create")}
                    size="s"
                    bgColor={ColorSelector("--g-color13")}
                    textColor={ColorSelector("--g-color1")}
                    maxWidth="160px"
                    casual
                    onClick={onCreateTask}
                    shadowColor={ColorSelector("--g-color8")}
                />
            </div>

            <div className={styles.usageGrid}>
                <article>
                    <span>{t("usage.total")}</span>
                    <strong>{totalTasks}</strong>
                </article>
                <article>
                    <span>{t("usage.today")}</span>
                    <strong>{todayTasksCount}</strong>
                </article>
                <article>
                    <span>{t("usage.repeating")}</span>
                    <strong>{repeatingTasksCount}</strong>
                </article>
                <article>
                    <span>{t("usage.private")}</span>
                    <strong>{privateTasksCount}</strong>
                </article>
            </div>
        </>
    );
}
