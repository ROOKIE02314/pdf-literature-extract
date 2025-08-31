<template>
  <div class="file-uploader">
    <div class="upload-area" :class="{ 'drag-over': isDragOver, 'loading': isLoading }">
      <div v-if="!isLoading" class="upload-content">
        <div class="upload-icon">
          📄
        </div>
        <h3>上传PDF文献</h3>
        <p>拖拽PDF文件到此处，或点击选择文件</p>
        <button @click="triggerFileInput" class="upload-btn">
          选择文件
        </button>
        <input 
          ref="fileInput"
          type="file" 
          accept=".pdf"
          @change="handleFileSelect"
          style="display: none;"
        >
        <div class="file-info">
          <small>支持格式：PDF | 最大大小：10MB</small>
        </div>
      </div>
      
      <div v-else class="loading-content">
        <div class="spinner"></div>
        <p>正在处理PDF文件...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileUploader',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDragOver: false,
      progress: 0,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    }
  },
  watch: {
    isLoading(newVal) {
      if (newVal) {
        this.startProgress()
      } else {
        this.progress = 0
      }
    }
  },
  mounted() {
    this.setupDragEvents()
  },
  methods: {
    setupDragEvents() {
      const uploadArea = this.$el.querySelector('.upload-area')
      
      uploadArea.addEventListener('dragover', this.handleDragOver)
      uploadArea.addEventListener('dragenter', this.handleDragEnter)
      uploadArea.addEventListener('dragleave', this.handleDragLeave)
      uploadArea.addEventListener('drop', this.handleDrop)
    },
    
    handleDragOver(e) {
      e.preventDefault()
    },
    
    handleDragEnter(e) {
      e.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(e) {
      e.preventDefault()
      this.isDragOver = false
    },
    
    handleDrop(e) {
      e.preventDefault()
      this.isDragOver = false
      
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },
    
    processFile(file) {
      // 文件验证
      if (!this.validateFile(file)) {
        return
      }
      
      // 发送文件上传事件
      this.$emit('file-uploaded', file)
    },
    
    validateFile(file) {
      // 检查文件类型
      if (file.type !== 'application/pdf') {
        this.$emit('upload-error', '请上传PDF格式文件')
        return false
      }
      
      // 检查文件大小
      if (file.size > this.maxFileSize) {
        this.$emit('upload-error', '文件大小不能超过10MB')
        return false
      }
      
      return true
    },
    
    startProgress() {
      this.progress = 0
      const interval = setInterval(() => {
        this.progress += Math.random() * 15
        if (this.progress >= 90) {
          this.progress = 90
          clearInterval(interval)
        }
      }, 200)
      
      // 在加载结束时清理
      this.$watch('isLoading', (newVal) => {
        if (!newVal) {
          clearInterval(interval)
          this.progress = 100
          setTimeout(() => {
            this.progress = 0
          }, 500)
        }
      })
    }
  }
}
</script>

<style scoped>
.file-uploader {
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  background: rgba(255, 255, 255, 0.95);
  border: 3px dashed #cbd5e0;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.upload-area.drag-over {
  border-color: #48bb78;
  background: rgba(72, 187, 120, 0.1);
}

.upload-area.loading {
  cursor: default;
  border-color: #667eea;
}

.upload-content {
  width: 100%;
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.upload-area h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.upload-area p {
  color: #718096;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.upload-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.file-info {
  color: #a0aec0;
  margin-top: 1rem;
}

.loading-content {
  width: 100%;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  color: #4a5568;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>