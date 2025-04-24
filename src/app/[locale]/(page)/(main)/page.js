import RecEventsSlider from "@/app/components/RecEventsSlider/RecEventsSlider";

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
        </div>
    );
}
