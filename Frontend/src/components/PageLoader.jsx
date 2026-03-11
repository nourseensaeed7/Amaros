import { useEffect, useState } from "react";

const PageLoader = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const images = document.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;

    if (total === 0) {
      setLoading(false);
      return;
    }

    const onLoad = () => {
      loaded++;
      if (loaded === total) setLoading(false);
    };

    images.forEach((img) => {
      if (img.complete) {
        onLoad();
      } else {
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onLoad); // count broken images too
      }
    });

    // fallback — never stuck on loading
    const timeout = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f5f5f5] z-50">
        <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-yellow-700 font-semibold tracking-wide cinzel text-lg">
          Amaros
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageLoader;