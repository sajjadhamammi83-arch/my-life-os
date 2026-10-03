import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, findUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("life_os_session")?.value;
  if (!token) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }

  const username = verifySessionToken(token);
  if (!username) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }

  const user = findUser(username);
  if (!user) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
  });
}
