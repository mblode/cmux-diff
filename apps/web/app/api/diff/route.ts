import { NextResponse } from "next/server";
import { getDiff } from "@/lib/git";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") ?? undefined;
  try {
    const result = await getDiff(base);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
