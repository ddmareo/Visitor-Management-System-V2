"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const Page = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role) {
        setShowContent(true);
      }
    } else if (status === "unauthenticated") {
      setShowContent(true);
    }
  }, [session, status]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "user":
        router.push("/user/home");
        break;
      case "security":
        router.push("/security/home");
        break;
      default:
        router.push("/");
    }
  };

  const handleBackToHome = () => {
    if (session?.user?.role) {
      redirectBasedOnRole(session.user.role);
    } else {
      router.push("/");
    }
  };

  if (!showContent) {
    return null;
  }

  return (
    <section className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-gray-900 dark:text-white">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 dark:text-white">
            You do not have access to this page.
          </p>
          <p className="mb-8 text-lg font-light text-gray-600 dark:text-gray-300">
            Sorry, this page is restricted. You are either not logged in yet or
            you are logged in but do not have access to this page.
          </p>
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-center text-white bg-gray-900 dark:text-gray-900 dark:bg-gray-100 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 transition-all duration-200 hover:scale-105">
            Back to Homepage
          </button>
        </div>
      </div>
    </section>
  );
};

export default Page;
