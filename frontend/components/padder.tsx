import Footer from "./footer";

const Padder = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 pt-4 mx-auto w-full max-w-7xl flex-1">{children}</div>
      <Footer />
    </div>
  );
};

export default Padder;
