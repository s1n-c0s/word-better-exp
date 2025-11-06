// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // ไฟล์ที่ Tailwind ควรตรวจสอบ (Content)
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 💡 เพิ่ม 'anuphan' เข้าไปใน font-family stack
      fontFamily: {
        // คลาส Tailwind: font-anuphan
        // กำหนดฟอนต์ 'Anuphan' เป็นฟอนต์แรก และตามด้วย sans-serif มาตรฐาน
        anuphan: ["Anuphan", "sans-serif"],
      },
    },
  },
  plugins: [],
};
