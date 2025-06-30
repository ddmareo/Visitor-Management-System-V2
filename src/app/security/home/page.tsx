import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VisitForm from "@/components/visitform";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.role !== "security" &&
      session.user.role !== "admin" &&
      session.user.role !== "sec_admin")
  ) {
    redirect("/error/restricted");
  }

  return (
    <div className="flex justify-center items-center pt-16 sm:ml-40 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <VisitForm />
    </div>
  );
};

export default page;
