import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/Houseman/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/bankda': {
        target: 'https://a.bankda.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bankda/, '/dtsvc'),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'data-tenants': ['./src/data/tenants.ts'],
          'data-billing': ['./src/data/billingConfig.ts'],
        },
      },
    },
  },
})
