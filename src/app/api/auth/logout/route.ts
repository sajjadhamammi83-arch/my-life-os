import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "با موفقیت خارج شدید." });
  res.cookies.set("life_os_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
