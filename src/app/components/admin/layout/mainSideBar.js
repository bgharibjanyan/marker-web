import styles from "./styles.module.scss";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";

export default () => {

    const navigationList = [
        {
            label: "personalization",
            url: "personalization"
        }, {
            label: "accounts",
            url: "accounts"
        }, {
            label: "adds",
            url: "adds"
        }, {
            label: "personalization",
            url: "personalization"
        }, {
            label: "accounts",
            url: "accounts"
        }, {
            label: "adds",
            url: "adds"
        }, {
            label: "personalization",
            url: "personalization"
        }, {
            label: "accounts",
            url: "accounts"
        }, {
            label: "adds",
            url: "adds"
        },
    ]

    return (
        <div className={styles.sidebar}>
            <div className={styles.headline}>
                <span className={styles.t3}>Marker Admin</span>
            </div>

            {/*<button className={styles.toggleButton}>*/}
            {/*    <svg className={`${styles.icon} ${styles.next}`}>*/}
            {/*        <use href={`/images/sprites.svg#icon-arrow-right`}></use>*/}
            {/*    </svg>*/}
            {/*</button>*/}

            <div className={styles.navList}>
                {navigationList.map((item, index) => (
                        <div key={index} className={styles.navItem}>
                            <LinkButton
                                text={item.label}
                                url={item.url}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}