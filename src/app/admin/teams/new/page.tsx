export const dynamic = 'force-dynamic'
import TeamForm from "../TeamForm";

export default function NewTeamPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">チーム新規登録</h1>
      <TeamForm />
    </div>
  );
}
