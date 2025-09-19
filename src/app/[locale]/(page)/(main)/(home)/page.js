import RecEventsSlider from "@/app/components/RecEventsSlider/RecEventsSlider";
import NetworkWidget from "@/app/components/widgets/Network/Network";
import Button from "@/app/components/util/buttons/MarkerButton/Button";

import styles from "./page.module.scss";
import InTimeTasks from "@/app/components/widgets/tasks/InTimeTasks/InTimeTasks";
import InTimeTasksWidget from "@/app/components/widgets/tasks/InTimeTasks/InTimeTasks";

export default function Dashboard() {

    const slides=[
        {
            url:"#",
            imgSrc:'/uploads/slider/1.png'
        }, {
            url:"#",
            imgSrc:'/uploads/slider/2.png'
        }, {
            url:"#",
            imgSrc:'/uploads/slider/3.png'
        }, {
            url:"#",
            imgSrc:'/uploads/slider/4.png'
        }, {
            url:"#",
            imgSrc:'/uploads/slider/5.png'
        }
    ]

    return (
        <div>
            <RecEventsSlider slides={slides}></RecEventsSlider>

            <div className={styles.homePageHeading}>
                <div className={styles.textContent}>
                    <h3 className={styles.headline}>Hi User</h3>
                    <span className={`${styles.subHeadline} ${styles.t6}`}>Welcome to marker demo </span>
                </div>

                <Button
                    type="primary"
                    text="My Yasks"
                    size="s"
                    bgColor="#FF5D66"
                    textColor="white"
                    maxWidth="120px"
                    // onClick={() => console.log('my Tasks')}
                    casual={true}
                    shadowColor="#9E373E"
                />
            </div>

            <div className={styles.contentContainer}>
                <div className={styles.leftSidebar}>
                    <NetworkWidget></NetworkWidget>
                </div>
                <div className={styles.mainContent}></div>
                <div className={styles.rightSidebar}>
                    <InTimeTasksWidget></InTimeTasksWidget>
                </div>
            </div>
        </div>
    );
}
