export class TextProcessor {
  /**
   * 清理和标准化文本
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') {
      return ''
    }

    return text
      // 移除多余的空白字符
      .replace(/\s+/g, ' ')
      // 移除特殊字符和控制字符
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // 统一换行符
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // 移除多余的换行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 移除行首行尾空白
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // 移除开头和结尾的空白
      .trim()
  }

  /**
   * 格式化内容用于显示
   * @param {string} content - 内容文本
   * @returns {string} 格式化后的文本
   */
  formatContent(content) {
    if (!content || typeof content !== 'string') {
      return ''
    }

    let formatted = this.cleanText(content)

    // 移除常见的PDF提取噪音
    formatted = this.removeCommonNoises(formatted)

    // 处理段落间距
    formatted = this.normalizeParagraphs(formatted)

    // 处理特殊标点
    formatted = this.normalizeePunctuation(formatted)

    // 限制长度并添加省略号
    if (formatted.length > 1500) {
      formatted = this.truncateContent(formatted, 1500)
    }

    return formatted
  }

  /**
   * 移除常见的PDF提取噪音
   * @param {string} text - 文本内容
   * @returns {string} 清理后的文本
   */
  removeCommonNoises(text) {
    return text
      // 移除页码
      .replace(/^\s*\d+\s*$/gm, '')
      // 移除页眉页脚常见内容
      .replace(/^\s*(?:第\s*\d+\s*页|Page\s*\d+)\s*$/gim, '')
      // 移除单独的标点符号行
      .replace(/^\s*[.,;:!?。，；：！？]\s*$/gm, '')
      // 移除过短的行（可能是噪音）
      .replace(/^\s*.{1,3}\s*$/gm, '')
      // 移除重复的特殊字符
      .replace(/([^\w\s])\1{3,}/g, '$1')
      // 移除多余的空行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
  }

  /**
   * 标准化段落格式
   * @param {string} text - 文本内容
   * @returns {string} 格式化后的文本
   */
  normalizeParagraphs(text) {
    return text
      // 确保句子间有适当的空格
      .replace(/([。！？])([^"\s])/g, '$1 $2')
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      // 处理列表项
      .replace(/^\s*[-•]\s*/gm, '• ')
      .replace(/^\s*\d+\.\s*/gm, (match, offset, string) => {
        const num = match.match(/\d+/)[0]
        return `${num}. `
      })
      // 确保段落间有换行
      .replace(/([。！？])(\s*)([A-Z\u4e00-\u9fff])/g, '$1\n\n$3')
  }

  /**
   * 标准化标点符号
   * @param {string} text - 文本内容
   * @returns {string} 标准化后的文本
   */
  normalizeePunctuation(text) {
    return text
      // 统一中文标点
      .replace(/，\s*/g, '，')
      .replace(/。\s*/g, '。')
      .replace(/！\s*/g, '！')
      .replace(/？\s*/g, '？')
      .replace(/；\s*/g, '；')
      .replace(/：\s*/g, '：')
      // 统一英文标点
      .replace(/,\s*/g, ', ')
      .replace(/\.\s+/g, '. ')
      .replace(/!\s*/g, '! ')
      .replace(/\?\s*/g, '? ')
      .replace(/;\s*/g, '; ')
      .replace(/:\s*/g, ': ')
      // 处理引号
      .replace(/"\s*/g, '"')
      .replace(/\s*"/g, '"')
      .replace(/'\s*/g, ''')
      .replace(/\s*'/g, ''')
  }

  /**
   * 截断内容并添加省略号
   * @param {string} content - 内容文本
   * @param {number} maxLength - 最大长度
   * @returns {string} 截断后的文本
   */
  truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
      return content
    }

    // 尝试在句子边界截断
    const truncated = content.slice(0, maxLength)
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('。'),
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('！'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('？'),
      truncated.lastIndexOf('?')
    )

    if (lastSentenceEnd > maxLength * 0.8) {
      return truncated.slice(0, lastSentenceEnd + 1)
    }

    // 尝试在逗号或空格处截断
    const lastComma = truncated.lastIndexOf('，')
    const lastCommaEn = truncated.lastIndexOf(',')
    const lastSpace = truncated.lastIndexOf(' ')
    
    const cutPoint = Math.max(lastComma, lastCommaEn, lastSpace)
    
    if (cutPoint > maxLength * 0.9) {
      return truncated.slice(0, cutPoint) + '...'
    }

    return truncated + '...'
  }

  /**
   * 提取关键词
   * @param {string} text - 文本内容
   * @param {number} count - 关键词数量
   * @returns {Array<string>} 关键词数组
   */
  extractKeywords(text, count = 5) {
    if (!text || typeof text !== 'string') {
      return []
    }

    // 移除标点符号和特殊字符
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 分词（简单的基于空格和长度的分词）
    const words = cleanText
      .split(/\s+/)
      .filter(word => {
        // 过滤条件
        return word.length > 1 && 
               !this.isStopWord(word) &&
               !/^\d+$/.test(word) // 排除纯数字
      })

    // 统计词频
    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // 按频率排序并返回前N个
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word)
  }

  /**
   * 判断是否为停用词
   * @param {string} word - 单词
   * @returns {boolean} 是否为停用词
   */
  isStopWord(word) {
    const stopWords = new Set([
      // 英文停用词
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      
      // 中文停用词
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
      '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
      '看', '好', '自己', '这', '那', '他', '她', '它', '们', '这个', '那个',
      '什么', '怎么', '为什么', '因为', '所以', '但是', '如果', '虽然', '然而'
    ])

    return stopWords.has(word.toLowerCase())
  }

  /**
   * 计算文本相似度（简单的基于词汇重叠）
   * @param {string} text1 - 文本1
   * @param {string} text2 - 文本2
   * @returns {number} 相似度（0-1之间）
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) {
      return 0
    }

    const words1 = new Set(this.extractWords(text1))
    const words2 = new Set(this.extractWords(text2))

    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * 提取文本中的词汇
   * @param {string} text - 文本内容
   * @returns {Array<string>} 词汇数组
   */
  extractWords(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.isStopWord(word))
  }

  /**
   * 验证文本质量
   * @param {string} text - 文本内容
   * @returns {Object} 质量评估结果
   */
  assessTextQuality(text) {
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        issues: ['文本为空或无效']
      }
    }

    const issues = []
    let score = 100

    // 长度检查
    if (text.length < 50) {
      issues.push('文本过短')
      score -= 30
    } else if (text.length > 5000) {
      issues.push('文本过长')
      score -= 10
    }

    // 句子数量检查
    const sentences = text.split(/[。.!?！？]/).filter(s => s.trim().length > 10)
    if (sentences.length < 2) {
      issues.push('句子数量过少')
      score -= 20
    }

    // 字符种类检查
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length
    const totalChars = text.replace(/\s/g, '').length

    if (totalChars > 0) {
      const chineseRatio = chineseChars / totalChars
      const englishRatio = englishChars / totalChars
      
      if (chineseRatio < 0.1 && englishRatio < 0.3) {
        issues.push('有效字符比例过低')
        score -= 25
      }
    }

    // 重复内容检查
    const words = this.extractWords(text)
    const uniqueWords = new Set(words)
    const repetitionRatio = 1 - (uniqueWords.size / words.length)
    
    if (repetitionRatio > 0.7) {
      issues.push('重复内容过多')
      score -= 20
    }

    return {
      score: Math.max(0, score),
      issues,
      wordCount: words.length,
      uniqueWordCount: uniqueWords.size,
      sentenceCount: sentences.length,
      chineseRatio: chineseChars / totalChars,
      englishRatio: englishChars / totalChars
    }
  }
}