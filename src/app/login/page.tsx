"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, AlertCircle } from "lucide-react";
import Turnstile from "react-turnstile";

const Page = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectBasedOnRole = useCallback(
    (role: string) => {
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
    },
    [router]
  );

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      redirectBasedOnRole(session.user.role);
    }
  }, [session, status, redirectBasedOnRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        token: turnstileToken,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("An error occurred during sign in:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-gray-300">
              Please enter your details to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 h-5 w-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 ease-in-out"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 h-5 w-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 ease-in-out"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="my-4">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onVerify={(token) => setTurnstileToken(token)}
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transform transition-all duration-200 ease-in-out hover:scale-[1.02] dark:bg-gray-100 dark:text-black dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={!turnstileToken || loading}>
              {loading ? (
                <span>Memproses...</span>
              ) : !turnstileToken ? (
                <span>Loading...</span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Page;
