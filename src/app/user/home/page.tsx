import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VisitList from "@/components/visitlist";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "user") {
    redirect("/error/restricted");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-4 sm:ml-64 mt-16">
        <VisitList />
      </main>
    </div>
  );
};

export default page;
