"use client";

/* Pick + downscale a photo to a dataURL — 100% offline, on-device.
   (Port of features4.js pickPhoto; swap to Supabase Storage later.) */

export function pickPhoto(maxW = 1100): Promise<string | null> {
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) {
        inp.remove();
        return resolve(null);
      }
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const sc = Math.min(1, maxW / img.width);
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * sc);
          c.height = Math.round(img.height * sc);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          inp.remove();
          resolve(c.toDataURL("image/jpeg", 0.78));
        };
        img.onerror = () => {
          inp.remove();
          resolve(null);
        };
        img.src = r.result as string;
      };
      r.onerror = () => {
        inp.remove();
        resolve(null);
      };
      r.readAsDataURL(f);
    };
    inp.click();
  });
}
