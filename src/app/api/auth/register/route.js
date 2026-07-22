import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {createSession, getAuthCollections, setSessionCookie, validateMutationOrigin} from "@/app/api/_auth/session";import {serializeSelfUser} from "@/app/api/profile/_shared";
import User from "../../../../models/user/User";
import {hash} from "bcryptjs";
import {NextResponse} from "next/server";
import {enforceIpRateLimit} from "@/server/security/rate-limiter";
import {isValidEmail, normalizeBoundedString, rejectOversizedRequest} from "@/server/http/request-validation";

async function POSTHandler(request) {
    const originError = validateMutationOrigin(request);    if (originError) {
        return originError;
    }
    try {
        const sizeError = rejectOversizedRequest(request, 16 * 1024);
        if (sizeError) return sizeError;
        const rateLimitError = await enforceIpRateLimit(request, {
            scope: "user-registration",
            limit: 5,
            windowMs: 60 * 60 * 1000,
        });
        if (rateLimitError) return rateLimitError;

        const body = await request.json();
        const firstname = normalizeBoundedString(body.firstname, {min: 1, max: 80});
        const lastname = normalizeBoundedString(body.lastname, {max: 80});
        const normalizedLogin = normalizeBoundedString(body.login, {min: 3, max: 40});
        const normalizedEmail = normalizeBoundedString(body.email, {min: 3, max: 254, lowercase: true});
        const password = normalizeBoundedString(body.password, {min: 8, max: 128, trim: false});
        const age = Number(body.age);
        const sex = normalizeBoundedString(body.sex, {min: 1, max: 16, lowercase: true});
        const address = normalizeBoundedString(body.address, {max: 200});
        const country = normalizeBoundedString(body.country, {max: 80});
        const city = normalizeBoundedString(body.city, {max: 80});
        const profilePicture = normalizeBoundedString(body.profilePicture, {max: 500});

        if (!firstname || !normalizedLogin || !normalizedEmail || !password || !Number.isInteger(age)
            || age < 13 || age > 120 || !["male", "female", "other"].includes(sex)
            || !isValidEmail(normalizedEmail) || !/^[a-zA-Z0-9._-]+$/.test(normalizedLogin)) {
            return Response.json({error: "Invalid registration data"}, {status: 400});
        }

        const {usersCollection} = await getAuthCollections();
        const existingUser = await usersCollection.findOne(
            {$or: [{login: normalizedLogin}, {email: normalizedEmail}]},
            {collation: {locale: "en", strength: 2}},
        );
        if (existingUser) {
            return Response.json({error: "Login or email already exists"}, {status: 409});
        }
        const defaultProfilePicture = profilePicture
            || `/uploads/profiles/default/${sex === "male" ? "male.png" : "female.png"}`;
        const newUser = new User({
            firstname: String(firstname).trim(),
            login: normalizedLogin,
            email: normalizedEmail,
            password: await hash(String(password), 12),
            age,
            sex,
            lastname,
            address,
            country,
            city,
            profilePicture: defaultProfilePicture,
        });
        const result = await usersCollection.insertOne(newUser);
        newUser._id = result.insertedId;

        const session = await createSession(result.insertedId);
        const response = NextResponse.json({
            message: "User registered successfully",
            user: serializeSelfUser(newUser),
        }, {status: 201});
        return setSessionCookie(response, session.token, session.expiresAt);
    } catch (error) {
        if (error?.code === 11000) {
            return Response.json({error: "Login or email already exists"}, {status: 409});
        }
        logger.error("api.handler.error", {message: "Error registering user:", error: error});
        return Response.json({error: "Failed to register user"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/auth/register", method: "POST"});