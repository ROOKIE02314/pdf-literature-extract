import * as pdfjsLib from 'pdfjs-dist'
import { TextProcessor } from './TextProcessor.js'

export class PDFProcessor {
  constructor() {
    this.textProcessor = new TextProcessor()
  }

  /**
   * 从PDF文件中提取文本内容
   * @param {File} file - PDF文件
   * @returns {Promise<string>} 提取的文本内容
   */
  async extractText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      
      // 逐页提取文本
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
        
        fullText += pageText + '\n\n'
      }
      
      return this.textProcessor.cleanText(fullText)
    } catch (error) {
      console.error('PDF文本提取失败:', error)
      throw new Error('PDF文件解析失败，请确认文件格式正确')
    }
  }

  /**
   * 从文本中提取摘要
   * @param {string} text - 全文本内容
   * @returns {Promise<string>} 提取的摘要
   */
  async extractAbstract(text) {
    const cleanText = this.textProcessor.cleanText(text)
    
    // 摘要识别模式（按优先级排列）
    const abstractPatterns = [
      // 英文摘要模式
      /abstract\s*[:：]\s*(.*?)(?=\n\s*(?:keywords?|introduction|1\.|§|\d+\.)|$)/gis,
      /abstract\s*[：:]\s*(.*?)(?=\n\s*(?:key\s*words?|keywords?|引言|绪论|前言|1\.|§|\d+\.)|$)/gis,
      
      // 中文摘要模式
      /摘\s*要\s*[:：]\s*(.*?)(?=\n\s*(?:关键词|引言|绪论|前言|1\.|§|\d+\.)|$)/gis,
      /【摘要】\s*(.*?)(?=\n\s*(?:【关键词】|引言|绪论|前言|1\.|§|\d+\.)|$)/gis,
      
      // 通用模式
      /(?:abstract|摘要|ABSTRACT)\s*[：:：]\s*(.*?)(?=\n\s*(?:关键词|keywords?|引言|introduction|1\.|§|\d+\.)|$)/gis
    ]

    for (const pattern of abstractPatterns) {
      const matches = cleanText.match(pattern)
      if (matches && matches.length > 0) {
        for (const match of matches) {
          const abstractText = this.extractAbstractFromMatch(match)
          if (this.validateAbstract(abstractText)) {
            return this.textProcessor.formatContent(abstractText)
          }
        }
      }
    }

    // 如果没有找到明确的摘要，尝试启发式提取
    return this.fallbackAbstractExtraction(cleanText)
  }

  /**
   * 从匹配项中提取摘要文本
   * @param {string} match - 正则匹配结果
   * @returns {string} 清理后的摘要文本
   */
  extractAbstractFromMatch(match) {
    // 移除标题部分，只保留内容
    let abstractText = match
      .replace(/^(?:abstract|摘要|ABSTRACT|【摘要】)\s*[：:：]\s*/i, '')
      .trim()

    // 清理常见的结尾标记
    abstractText = abstractText
      .replace(/(?:\n\s*(?:keywords?|关键词|【关键词】).*$)/gis, '')
      .replace(/(?:\n\s*(?:key\s*words?).*$)/gis, '')
      .trim()

    return abstractText
  }

  /**
   * 验证摘要的有效性
   * @param {string} abstract - 摘要文本
   * @returns {boolean} 是否为有效摘要
   */
  validateAbstract(abstract) {
    if (!abstract || typeof abstract !== 'string') {
      return false
    }

    const trimmedAbstract = abstract.trim()
    
    // 长度检查
    if (trimmedAbstract.length < 50 || trimmedAbstract.length > 2000) {
      return false
    }

    // 内容质量检查
    const sentences = trimmedAbstract.split(/[。.!?！？]/).filter(s => s.trim().length > 10)
    if (sentences.length < 2) {
      return false
    }

    // 检查是否包含常见的摘要关键词
    const abstractKeywords = [
      'research', 'study', 'analysis', 'method', 'result', 'conclusion',
      '研究', '分析', '方法', '结果', '结论', '目的', '基于', '提出'
    ]
    
    const hasKeywords = abstractKeywords.some(keyword => 
      trimmedAbstract.toLowerCase().includes(keyword.toLowerCase())
    )

    return hasKeywords
  }

  /**
   * 备用摘要提取方法
   * @param {string} text - 全文本内容
   * @returns {string} 提取的摘要
   */
  fallbackAbstractExtraction(text) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100)
    
    if (paragraphs.length === 0) {
      return '未能提取到有效的摘要内容'
    }

    // 寻找最可能是摘要的段落（通常在文档开头）
    for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
      const paragraph = paragraphs[i].trim()
      if (this.validateAbstract(paragraph)) {
        return this.textProcessor.formatContent(paragraph)
      }
    }

    // 如果都不符合，返回第一个较长的段落
    const firstLongParagraph = paragraphs.find(p => p.length > 200 && p.length < 1000)
    if (firstLongParagraph) {
      return this.textProcessor.formatContent(firstLongParagraph.slice(0, 500) + '...')
    }

    return '未能识别出明确的摘要内容'
  }

  /**
   * 将剩余内容分割成8个部分
   * @param {string} fullText - 全文本内容
   * @param {string} abstractContent - 已提取的摘要内容
   * @returns {Promise<Array<string>>} 分割后的内容数组
   */
  async segmentContent(fullText, abstractContent) {
    // 移除摘要部分
    let remainingText = fullText
    if (abstractContent && abstractContent !== '未能识别出明确的摘要内容') {
      // 找到摘要在原文中的位置并移除
      const abstractStart = fullText.toLowerCase().indexOf(abstractContent.toLowerCase().slice(0, 100))
      if (abstractStart !== -1) {
        remainingText = fullText.slice(0, abstractStart) + fullText.slice(abstractStart + abstractContent.length)
      }
    }

    // 尝试基于内容结构分段
    const structuredSegments = this.segmentByStructure(remainingText)
    if (structuredSegments.length >= 4) {
      return this.normalizeSegments(structuredSegments, 8)
    }

    // 备用方案：均匀分割
    return this.segmentEvenly(remainingText, 8)
  }

  /**
   * 基于文档结构分段
   * @param {string} text - 文本内容
   * @returns {Array<string>} 分段结果
   */
  segmentByStructure(text) {
    const segments = []
    
    // 常见的学术论文章节标题模式
    const sectionPatterns = [
      /(?:^|\n)\s*(?:1\.|一、|I\.|Introduction|引言|绪论|前言)\s*/gim,
      /(?:^|\n)\s*(?:2\.|二、|II\.|Method|Methodology|方法|研究方法)\s*/gim,
      /(?:^|\n)\s*(?:3\.|三、|III\.|Result|Results|结果|实验结果)\s*/gim,
      /(?:^|\n)\s*(?:4\.|四、|IV\.|Discussion|讨论|分析)\s*/gim,
      /(?:^|\n)\s*(?:5\.|五、|V\.|Conclusion|结论|总结)\s*/gim,
      /(?:^|\n)\s*(?:6\.|六、|VI\.|Reference|References|参考文献)\s*/gim
    ]

    let lastIndex = 0
    let matches = []

    // 找到所有章节标题位置
    sectionPatterns.forEach(pattern => {
      const match = pattern.exec(text)
      if (match) {
        matches.push({ index: match.index, pattern })
        pattern.lastIndex = 0 // 重置正则表达式
      }
    })

    // 按位置排序
    matches.sort((a, b) => a.index - b.index)

    // 根据章节标题分段
    for (let i = 0; i < matches.length; i++) {
      const start = i === 0 ? 0 : matches[i].index
      const end = i === matches.length - 1 ? text.length : matches[i + 1].index
      
      const segment = text.slice(start, end).trim()
      if (segment.length > 100) {
        segments.push(this.textProcessor.formatContent(segment))
      }
    }

    // 如果没有找到足够的结构化分段，按段落分割
    if (segments.length < 3) {
      return this.segmentByParagraphs(text)
    }

    return segments
  }

  /**
   * 按段落分段
   * @param {string} text - 文本内容
   * @returns {Array<string>} 分段结果
   */
  segmentByParagraphs(text) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50)
    const segments = []
    
    // 将段落组合成合适大小的段
    let currentSegment = ''
    const targetLength = Math.floor(text.length / 8)

    for (const paragraph of paragraphs) {
      if (currentSegment.length + paragraph.length > targetLength && currentSegment.length > 100) {
        segments.push(this.textProcessor.formatContent(currentSegment.trim()))
        currentSegment = paragraph
      } else {
        currentSegment += (currentSegment ? '\n\n' : '') + paragraph
      }
    }

    if (currentSegment.trim().length > 100) {
      segments.push(this.textProcessor.formatContent(currentSegment.trim()))
    }

    return segments
  }

  /**
   * 均匀分割文本
   * @param {string} text - 文本内容
   * @param {number} parts - 分割数量
   * @returns {Array<string>} 分割结果
   */
  segmentEvenly(text, parts) {
    const cleanText = this.textProcessor.cleanText(text)
    const segmentLength = Math.floor(cleanText.length / parts)
    const segments = []

    for (let i = 0; i < parts; i++) {
      const start = i * segmentLength
      const end = i === parts - 1 ? cleanText.length : (i + 1) * segmentLength
      
      let segment = cleanText.slice(start, end).trim()
      
      // 尝试在句子边界结束
      if (i < parts - 1 && segment.length > 0) {
        const lastSentenceEnd = Math.max(
          segment.lastIndexOf('。'),
          segment.lastIndexOf('.'),
          segment.lastIndexOf('！'),
          segment.lastIndexOf('!'),
          segment.lastIndexOf('？'),
          segment.lastIndexOf('?')
        )
        
        if (lastSentenceEnd > segmentLength * 0.7) {
          segment = segment.slice(0, lastSentenceEnd + 1)
        }
      }

      if (segment.length > 0) {
        segments.push(this.textProcessor.formatContent(segment))
      }
    }

    return segments
  }

  /**
   * 标准化分段数量
   * @param {Array<string>} segments - 原始分段
   * @param {number} targetCount - 目标数量
   * @returns {Array<string>} 标准化后的分段
   */
  normalizeSegments(segments, targetCount) {
    if (segments.length === targetCount) {
      return segments
    }

    if (segments.length > targetCount) {
      // 合并多余的段
      const result = segments.slice(0, targetCount - 1)
      const remaining = segments.slice(targetCount - 1).join('\n\n')
      result.push(remaining)
      return result
    } else {
      // 分割不足的段
      const result = [...segments]
      while (result.length < targetCount) {
        // 找到最长的段进行分割
        let longestIndex = 0
        let longestLength = 0
        
        result.forEach((segment, index) => {
          if (segment.length > longestLength) {
            longestLength = segment.length
            longestIndex = index
          }
        })

        if (longestLength > 200) {
          const longSegment = result[longestIndex]
          const midPoint = Math.floor(longSegment.length / 2)
          const splitPoint = longSegment.indexOf('。', midPoint) !== -1 
            ? longSegment.indexOf('。', midPoint) + 1
            : longSegment.indexOf('.', midPoint) !== -1
            ? longSegment.indexOf('.', midPoint) + 1
            : midPoint

          const firstHalf = longSegment.slice(0, splitPoint).trim()
          const secondHalf = longSegment.slice(splitPoint).trim()

          result[longestIndex] = firstHalf
          result.push(secondHalf)
        } else {
          // 如果没有足够长的段，添加空段
          result.push('')
        }
      }

      return result.slice(0, targetCount)
    }
  }
}