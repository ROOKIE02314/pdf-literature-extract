<template>
  <div class="app">
    <header class="app-header">
      <h1>📚 PDF文献内容提取系统</h1>
      <p>上传PDF文献，自动提取摘要并展示内容</p>
    </header>

    <main class="app-main">
      <!-- 文件上传组件 -->
      <FileUploader 
        v-if="!hasContent"
        @file-uploaded="handleFileUploaded"
        @upload-error="handleUploadError"
        :is-loading="isLoading"
      />

      <!-- 九宫格布局组件 -->
      <GridLayout 
        v-if="hasContent"
        :abstract-content="abstractContent"
        :other-contents="otherContents"
        @reset="resetContent"
      />

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        <p>❌ {{ error }}</p>
        <button @click="resetError" class="retry-btn">重新尝试</button>
      </div>
    </main>
  </div>
</template>

<script>
import FileUploader from './components/FileUploader.vue'
import GridLayout from './components/GridLayout.vue'
import { PDFProcessor } from './services/PDFProcessor.js'

export default {
  name: 'App',
  components: {
    FileUploader,
    GridLayout
  },
  data() {
    return {
      isLoading: false,
      error: null,
      abstractContent: '',
      otherContents: [],
      pdfProcessor: new PDFProcessor()
    }
  },
  computed: {
    hasContent() {
      return this.abstractContent || this.otherContents.length > 0
    }
  },
  methods: {
    async handleFileUploaded(file) {
      this.isLoading = true
      this.error = null
      
      try {
        // 提取PDF文本
        const fullText = await this.pdfProcessor.extractText(file)
        
        // 提取摘要
        const abstract = await this.pdfProcessor.extractAbstract(fullText)
        
        // 分割其他内容
        const segments = await this.pdfProcessor.segmentContent(fullText, abstract)
        
        this.abstractContent = abstract
        this.otherContents = segments
        
      } catch (error) {
        console.error('PDF处理失败:', error)
        this.error = '文件处理失败，请检查PDF格式是否正确'
      } finally {
        this.isLoading = false
      }
    },
    
    handleUploadError(errorMessage) {
      this.error = errorMessage
      this.isLoading = false
    },
    
    resetContent() {
      this.abstractContent = ''
      this.otherContents = []
      this.error = null
    },
    
    resetError() {
      this.error = null
    }
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  text-align: center;
  padding: 2rem 1rem;
  color: white;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.app-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.app-main {
  padding: 0 1rem 2rem;
}

.error-message {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  margin: 2rem auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.error-message p {
  color: #e74c3c;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #2980b9;
}
</style>
