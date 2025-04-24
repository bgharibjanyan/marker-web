
export async function POST(request) {
    try {
        const body = await request.json();

        const { login, password } = body;

        if (!login || !password) {
            return Response.json({error: "Missing required fields"}, {status: 400});
        }

        console.log(login, password);
        if (login === "LIP" && password === "093536389bB@"){
            return Response.json(
                {message: "Login successful"},
                {status: 200}
            );
        }else {
            return Response.json({error: "Invalid login or password"}, {status: 400});
        }


    } catch (error) {
        console.error("Error logging in:", error);
        return Response.json({error: "Failed to login"}, {status: 500});
    }
}
