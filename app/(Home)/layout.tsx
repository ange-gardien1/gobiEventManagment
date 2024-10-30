import Footer from "@/components/component/footer";
import Header from "@/components/component/header";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex h-screen flex-col">
        <Header/>
         <main className="flex-1">{children}</main>
         <Footer/>
      </div>
    );
  }
  