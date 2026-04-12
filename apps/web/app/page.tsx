import { DiffApp } from "@/components/DiffApp";

export default function Home() {
  const repoPath = process.env.CMUX_DIFF_REPO ?? process.cwd();
  return <DiffApp repoPath={repoPath} />;
}
