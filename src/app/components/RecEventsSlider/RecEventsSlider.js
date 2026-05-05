'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import {Autoplay, Navigation, Pagination} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import styles from "./styles.module.scss";
import {useTranslations} from "next-intl";

export default ({
                    slides = [],

                }) => {
    const t = useTranslations('Global');


    if (!slides.length<= 5) {
        while (slides.length <= 5) {
            slides=[...slides,...slides]
        }
    }

    return (
        <div className={styles.sliderContainer}>

            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={5}
                speed={20000}
                autoplay={{
                    delay: 0,
                    disableOnInteraction: false,
                }}
                loop={true}
                breakpoints={{
                    0: {
                        slidesPerView: 1.4,
                    },
                    540: {
                        slidesPerView: 1.9,
                    },
                    720: {
                        slidesPerView: 3.2,
                    },
                    1024: {
                        slidesPerView: 4,
                    }, 1440: {
                        slidesPerView: 5,
                    },
                }}
            >

                {slides.map((slide, index) => (
                    <SwiperSlide key={index}>
                        <a href={slide.url}>
                            <div className={styles.slide} >
                                <img className={styles.eventWrapper} src={slide.imgSrc} alt={t('alt.eventSlide')}/>
                            </div>
                        </a>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};
