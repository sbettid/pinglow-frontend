import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.SERVER_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (urlPath) => urlPath.replace(/^\/api/, ''),
        },
      },
    },
  }
})
