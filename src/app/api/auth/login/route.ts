import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    const user = verifyUser(username, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "نام کاربری یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.username);
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    });

    res.cookies.set("life_os_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "خطای ورود به سیستم" },
      { status: 500 }
    );
  }
}
