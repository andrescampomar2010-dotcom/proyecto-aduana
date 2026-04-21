import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080b12]">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
