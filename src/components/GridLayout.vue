<template>
  <div class="grid-layout">
    <div class="grid-header">
      <h2>📄 文献内容分析结果</h2>
      <button @click="handleReset" class="reset-btn">
        🔄 重新上传
      </button>
    </div>
    
    <div class="grid-container">
      <!-- 摘要宫格 -->
      <div class="grid-item abstract-grid">
        <div class="grid-header-title">
          <h3>🎯 文献摘要</h3>
        </div>
        <div class="grid-content">
          <p v-if="abstractContent">{{ abstractContent }}</p>
          <p v-else class="no-content">未找到摘要内容</p>
        </div>
      </div>
      
      <!-- 其他内容宫格 -->
      <div 
        v-for="(content, index) in normalizedOtherContents" 
        :key="index"
        class="grid-item content-grid"
        :class="`content-grid-${index + 1}`"
      >
        <div class="grid-header-title">
          <h4>📃 内容段落 {{ index + 1 }}</h4>
        </div>
        <div class="grid-content">
          <p v-if="content">{{ content }}</p>
          <p v-else class="no-content">暂无内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GridLayout',
  props: {
    abstractContent: {
      type: String,
      default: ''
    },
    otherContents: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    normalizedOtherContents() {
      // 确保总是有8个元素
      const contents = [...this.otherContents]
      while (contents.length < 8) {
        contents.push('')
      }
      return contents.slice(0, 8)
    }
  },
  methods: {
    handleReset() {
      this.$emit('reset')
    }
  }
}
</script>

<style scoped>
.grid-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.grid-header h2 {
  color: #2d3748;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.reset-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #c53030;
  transform: translateY(-1px);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1.5rem;
  min-height: 70vh;
}

.grid-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.abstract-grid {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.abstract-grid .grid-header-title h3 {
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.content-grid .grid-header-title h4 {
  color: #4a5568;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.grid-content {
  flex: 1;
  overflow-y: auto;
}

.grid-content p {
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.abstract-grid .grid-content p {
  color: rgba(255, 255, 255, 0.95);
}

.content-grid .grid-content p {
  color: #2d3748;
}

.no-content {
  font-style: italic;
  opacity: 0.6;
  text-align: center;
  margin-top: 2rem;
}

/* 内容宫格的不同颜色主题 */
.content-grid-1 { border-left: 4px solid #f56565; }
.content-grid-2 { border-left: 4px solid #ed8936; }
.content-grid-3 { border-left: 4px solid #ecc94b; }
.content-grid-4 { border-left: 4px solid #48bb78; }
.content-grid-5 { border-left: 4px solid #38b2ac; }
.content-grid-6 { border-left: 4px solid #4299e1; }
.content-grid-7 { border-left: 4px solid #9f7aea; }
.content-grid-8 { border-left: 4px solid #ed64a6; }

/* 响应式设计 */
@media (max-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
  
  .abstract-grid {
    grid-column: 1 / -1;
    grid-row: 1;
  }
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .grid-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .grid-layout {
    padding: 0.5rem;
  }
}

/* 自定义滚动条 */
.grid-content::-webkit-scrollbar {
  width: 6px;
}

.grid-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.grid-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.abstract-grid .grid-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
}
</style>