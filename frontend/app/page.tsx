"use client";

import Header from "@/components/header";
import Padder from "@/components/padder";
import USDCWallet from "@/components/usdc-wallet";

const Page = () => {
  return (
    <Padder>
      <Header />
      <div className="max-w-lg mx-auto mt-10">


        <USDCWallet />
      </div>
    </Padder>
  );
};

export default Page;
