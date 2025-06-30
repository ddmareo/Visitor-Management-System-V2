import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Table from "@/components/table";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session?.user?.role !== "admin" && session?.user?.role !== "sec_admin")
  ) {
    redirect("/error/restricted");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 sm:ml-64 mt-[63px]">
        <div>
          <Table />
        </div>
      </main>
    </div>
  );
};

export default page;
