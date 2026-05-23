"use client";

import {use} from "react";
import ProfileContent from "../components/ProfileContent/ProfileContent";

export default function SharedProfilePage({params}) {
    const {userId} = use(params);

    return <ProfileContent userId={userId}/>;
}
