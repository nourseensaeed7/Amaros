import { useEffect, useState } from "react";
import header from "../assets/header.jpeg"; // import it here

const PageLoader = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const preloadBackground = new Promise((resolve) => {
      const img = new Image();
      img.src = header;
      img.onload = resolve;
      img.onerror = resolve; // don't get stuck if it fails
    });

    const preloadImgTags = new Promise((resolve) => {
      const images = document.querySelectorAll("img");
      const total = images.length;
      if (total === 0) return resolve();

      let loaded = 0;
      const onLoad = () => { if (++loaded === total) resolve(); };
      images.forEach((img) => {
        if (img.complete) onLoad();
        else {
          img.addEventListener("load", onLoad);
          img.addEventListener("error", onLoad);
        }
      });
    });

    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));

    Promise.race([
      Promise.all([preloadBackground, preloadImgTags]),
      timeout,
    ]).then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f5f5f5] z-50">
        <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-yellow-700 font-semibold tracking-wide cinzel text-lg">
          Loading...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageLoader;