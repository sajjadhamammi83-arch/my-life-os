import { NextRequest, NextResponse } from "next/server";
import { createUser, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, name } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: "نام کاربری باید حداقل ۳ کاراکتر باشد." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: "رمز عبور باید حداقل ۴ کاراکتر باشد." },
        { status: 400 }
      );
    }

    const newUser = createUser(username, password, name || username);
    const token = createSessionToken(newUser.username);

    const res = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
      },
    });

    res.cookies.set("life_os_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "خطای ثبت‌نام کاربر جدید" },
      { status: 400 }
    );
  }
}
