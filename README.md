# Quoc Tools

Một bộ sưu tập các công cụ chuyển đổi file tiện lợi, chạy hoàn toàn trên trình duyệt, giao diện tối giản, hiện đại và trực quan.

## 🚀 Tính năng chính

- Chuyển đổi file WebP sang PNG nhanh chóng, không cần upload lên server
- Chuyển đổi file CSV sang XLSX (Excel) trực tiếp trên trình duyệt
- Giao diện tối giản, cân bằng, dễ sử dụng

- Thông báo (toast) đẹp mắt khi thao tác thành công hoặc lỗi
- Không lưu trữ dữ liệu người dùng

## 🖥️ Demo giao diện

<!-- Thay ảnh minh họa bằng ảnh thực tế nếu có -->

![Screenshot](public/globe.svg)

## 📁 Cấu trúc thư mục

```
quoc_tools/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout tổng thể, căn giữa, tối giản
│   │   ├── globals.css        # Style toàn cục, token màu sắc, toast
│   │   └── tools/
│   │       ├── csv-to-xlsx/   # Trang chuyển CSV → XLSX
│   │       │   └── page.tsx
│   │       └── webp-to-png/  # Trang chuyển WebP → PNG
│   │           └── page.tsx
│   ├── components/
│   │   ├── PageHeader.tsx     # Header cho từng trang công cụ
│   │   ├── Toast.tsx         # Toast notification
│   │   └── ToolCard.tsx      # Card hiển thị công cụ
│   └── lib/
│       └── tools.config.ts    # Cấu hình các công cụ
├── public/
│   └── icons/                 # Icon SVG
├── package.json
└── ...
```

## 🛠️ Các công cụ hiện có

- **WebP → PNG**: `/tools/webp-to-png`
- **CSV → XLSX**: `/tools/csv-to-xlsx`

## 📦 Cài đặt & chạy local

```bash
# Cài dependencies
npm install

# Chạy dev
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000)

## ✨ Đóng góp

- Fork repo, tạo branch mới và gửi pull request
- Đóng góp thêm công cụ mới hoặc cải thiện UI/UX

## 📄 Giấy phép

MIT License
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
