import { useEffect, useState } from "react";

export function useIsPortrait() {
  const get = () => window.innerHeight >= window.innerWidth;
  const [portrait, setPortrait] = useState(get);

  useEffect(() => {
    const onResize = () => setPortrait(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return portrait;
}
