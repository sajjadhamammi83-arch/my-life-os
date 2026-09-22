import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sops = await prisma.sOP.findMany({ orderBy: { createdAt: "desc" } });
    const decisions = await prisma.decisionLog.findMany({ orderBy: { date: "desc" } });
    const notes = await prisma.note.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, sops, decisions, notes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      title,
      domain,
      trigger,
      steps,
      owner,
      context,
      decision,
      optionsConsidered,
      options,
      whyChosen,
      why,
      expectedOutcome,
      expectedResult,
      content,
      category,
    } = body;

    if (type === "sop") {
      const sop = await prisma.sOP.create({
        data: {
          title,
          domain: domain || "بوفه باشگاه",
          trigger: trigger || "درخواست مشتری",
          steps: steps || "",
          owner: owner || "مدیر سیستم",
        },
      });
      return NextResponse.json({ success: true, sop });
    }

    if (type === "decision") {
      const dec = await prisma.decisionLog.create({
        data: {
          date: new Date(),
          context: context || "",
          decision: decision || title || "تصمیم بدون عنوان",
          options: optionsConsidered || options || "بررسی گزینه‌ها",
          chosenOption: decision || title || "گزینه منتخب",
          why: whyChosen || why || "",
          expectedResult: expectedOutcome || expectedResult || "",
        },
      });
      return NextResponse.json({ success: true, decision: dec });
    }

    if (type === "note") {
      const note = await prisma.note.create({
        data: {
          title,
          content: content || "",
          category: category || "یادداشت",
        },
      });
      return NextResponse.json({ success: true, note });
    }

    return NextResponse.json({ success: false, error: "نوع سند مشخص نیست" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "شناسه الزامی است" }, { status: 400 });

    if (type === "sop") await prisma.sOP.delete({ where: { id } });
    else if (type === "decision") await prisma.decisionLog.delete({ where: { id } });
    else if (type === "note") await prisma.note.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
