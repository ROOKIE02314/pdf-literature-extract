import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/main.css'

// 配置 PDF.js worker
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.js',
  import.meta.url
).toString()

const app = createApp(App)
app.mount('#app')
