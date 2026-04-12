import { NextResponse } from "next/server";
import { addComment, deleteComment, readComments } from "@/lib/comments";

export async function GET() {
  return NextResponse.json(readComments());
}

export async function POST(request: Request) {
  const data = (await request.json()) as Parameters<typeof addComment>[0];
  const comment = addComment(data);
  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  deleteComment(id);
  return NextResponse.json({ ok: true });
}
