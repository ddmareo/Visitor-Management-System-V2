import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Welcome from "@/components/visitor-welcome";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session?.user?.role !== "admin" && session?.user?.role !== "sec_admin")
  ) {
    redirect("/error/restricted");
  }

  return (
    <div>
      <Welcome />
    </div>
  );
};

export default page;
