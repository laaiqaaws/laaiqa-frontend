import { redirect } from "next/navigation";
import { cookies as getCookies } from "next/headers";
import { API_BASE_URL, User } from "@/types/user";

export const dynamic = "force-dynamic";

async function getUserRole(): Promise<string | null> {
  try {
    const cookieStore = await Promise.resolve(getCookies());
    const sessionCookie = cookieStore.get("token");

    if (!sessionCookie) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data: { user: User } = await response.json();
      return data.user?.role ?? null;
    }
  } catch (error) {
  }

  return null;
}

export default async function Home() {
  const userRole = await getUserRole();

  if (userRole === "artist") redirect("/artist");
  else if (userRole === "customer") redirect("/customer");
  else if (userRole === "admin") redirect("/admin");
  else redirect("/login");

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#100D0F]">
      <p className="text-[#E5E5E5]">Loading...</p>
    </div>
  );
}