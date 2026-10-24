import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {demoApi} from './server/demoApi.ts'
export default defineConfig({ plugins: [react(),demoApi()], build: { chunkSizeWarningLimit: 1100 } })
