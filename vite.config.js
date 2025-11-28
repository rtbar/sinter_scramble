import { defineConfig } from 'vite'

export default defineConfig({
    root: './',
    publicDir: 'public',
    server: {
        host: '127.0.0.1'
    },
    base: './',
    build: {
        outDir: 'dist',
    }
})
