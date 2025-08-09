<template>
  <div class="mind-map-wrapper">
    <div ref="chartContainer" class="chart"></div>
    
    <!-- 调试面板 - 显示当前状态 -->
    <div class="debug-panel">
      <h4>节点状态 (实时)</h4>
      <div class="debug-content">
        <div v-for="(state, nodeId) in nodeStates" :key="nodeId" class="debug-item">
          <strong>{{ nodeId }}:</strong>
          <span :class="state.enabled ? 'enabled' : 'disabled'">
            {{ state.enabled ? '✅' : '❌' }} {{ state.priority }}优先级
          </span>
          <div class="features">
            <span v-for="(enabled, feature) in state.features" :key="feature" 
                  :class="enabled ? 'feature-on' : 'feature-off'">
              {{ feature }}{{ enabled ? '✓' : '✗' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)

// 第二层节点的交互状态
const nodeStates = ref({
  'programming-languages': {
    enabled: true,
    priority: 'high',
    features: {
      'TypeScript': true,
      'ES6+': true,
      'WebAssembly': false
    }
  },
  'frameworks': {
    enabled: false,
    priority: 'medium',
    features: {
      'SSR': true,
      'SPA': true,
      'PWA': false
    }
  },
  'dev-tools': {
    enabled: true,
    priority: 'high',
    features: {
      'DevOps': true,
      'CI/CD': true,
      'Monitoring': false
    }
  },
  'databases': {
    enabled: true,
    priority: 'medium',
    features: {
      'NoSQL': true,
      'ACID': false,
      'Sharding': true
    }
  },
  'visualization': {
    enabled: false,
    priority: 'low',
    features: {
      'WebGL': false,
      '3D': true,
      'Real-time': false
    }
  },
  'testing-tools': {
    enabled: true,
    priority: 'high',
    features: {
      'E2E': true,
      'Unit': true,
      'Integration': false
    }
  }
})

// 处理交互事件
const handleCheckboxChange = (nodeId, checked) => {
  nodeStates.value[nodeId].enabled = checked
  console.log(`${nodeId} enabled: ${checked}`)
}

const handlePriorityChange = (nodeId, priority) => {
  nodeStates.value[nodeId].priority = priority
  console.log(`${nodeId} priority changed to: ${priority}`)
}

const handleActionClick = (nodeId, action) => {
  console.log(`Action ${action} clicked for ${nodeId}`)
  // 这里可以添加具体的业务逻辑
}

const handleFeatureChange = (nodeId, feature, checked) => {
  if (nodeStates.value[nodeId] && nodeStates.value[nodeId].features) {
    nodeStates.value[nodeId].features[feature] = checked
    console.log(`${nodeId} feature ${feature}: ${checked}`)
    
    // 重新渲染该节点以反映状态变化
    updateNodeDisplay(nodeId)
  }
}

// 更新单个节点的显示
const updateNodeDisplay = (nodeId) => {
  // 找到对应的foreignObject并更新其内容
  const nodeData = data.find(d => d.id === nodeId)
  if (nodeData) {
    d3.selectAll('foreignObject')
      .filter(function(d) { return d && d.id === nodeId })
      .html(generateNodeHTML(nodeData))
  }
}

// 生成节点HTML内容的函数
const generateNodeHTML = (d) => {
  const nodeState = nodeStates.value[d.id] || { enabled: true, priority: 'medium', features: {} }
  
  return `
    <div class="node-content" style="
      width: 100%; 
      height: 100%; 
      padding: 10px; 
      color: white; 
      font-family: Arial, sans-serif;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    ">
      <!-- 头部区域 -->
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-size: 18px; margin-bottom: 3px;">${d.icon}</div>
        <div style="font-weight: bold; font-size: 11px; line-height: 1.2;">${d.name}</div>
      </div>
      
      <!-- 控制区域 -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0;">
        <!-- 启用复选框 -->
        <label style="display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer;">
          <input type="checkbox" 
                 ${nodeState.enabled ? 'checked' : ''} 
                 onchange="window.handleNodeCheckbox('${d.id}', this.checked)"
                 style="width: 14px; height: 14px;">
          <span>启用模块</span>
        </label>
        
        <!-- 优先级选择 -->
        <div style="font-size: 9px; margin: 3px 0; display: flex; align-items: center; gap: 4px;">
          <span>优先级:</span>
          <select onchange="window.handleNodePriority('${d.id}', this.value)" 
                  style="
                    font-size: 9px; 
                    flex: 1;
                    background: rgba(255,255,255,0.9); 
                    border: none; 
                    border-radius: 3px;
                    padding: 2px;
                  ">
            <option value="high" ${nodeState.priority === 'high' ? 'selected' : ''}>高</option>
            <option value="medium" ${nodeState.priority === 'medium' ? 'selected' : ''}>中</option>
            <option value="low" ${nodeState.priority === 'low' ? 'selected' : ''}>低</option>
          </select>
        </div>
        
        <!-- 功能特性表格 -->
        <div style="font-size: 8px; margin: 3px 0; flex: 1; min-height: 0;">
          <div style="font-weight: bold; margin-bottom: 3px;">特性配置:</div>
          <div style="
            max-height: 80px; 
            overflow-y: auto; 
            background: rgba(255,255,255,0.1); 
            border-radius: 3px;
            padding: 2px;
          ">
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(nodeState.features).map(([feature, enabled]) => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.15);">
                  <td style="padding: 2px 3px; font-size: 7px; line-height: 1.2;">${feature}</td>
                  <td style="padding: 2px 3px; text-align: center; width: 25px;">
                    <input type="checkbox" 
                           ${enabled ? 'checked' : ''}
                           onchange="window.handleFeatureChange('${d.id}', '${feature}', this.checked)"
                           style="width: 10px; height: 10px;">
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div style="display: flex; gap: 3px; margin: 3px 0;">
          <button onclick="window.handleNodeAction('${d.id}', 'config')" 
                  style="
                    flex: 1; 
                    font-size: 8px; 
                    padding: 4px 2px; 
                    border: none; 
                    border-radius: 3px; 
                    background: rgba(255,255,255,0.8); 
                    cursor: pointer;
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='rgba(255,255,255,1)'"
                  onmouseout="this.style.background='rgba(255,255,255,0.8)'">
            配置
          </button>
          <button onclick="window.handleNodeAction('${d.id}', 'deploy')" 
                  style="
                    flex: 1; 
                    font-size: 8px; 
                    padding: 4px 2px; 
                    border: none; 
                    border-radius: 3px; 
                    background: rgba(76, 175, 80, 0.8); 
                    color: white; 
                    cursor: pointer;
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='rgba(76, 175, 80, 1)'"
                  onmouseout="this.style.background='rgba(76, 175, 80, 0.8)'">
            部署
          </button>
        </div>
        
        <!-- 状态指示器 -->
        <div style="text-align: center; font-size: 8px; margin-top: 3px;">
          <span style="
            padding: 2px 6px; 
            border-radius: 3px; 
            background: ${nodeState.enabled ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
            display: inline-block;
            line-height: 1.2;
          ">
            ${nodeState.enabled ? '✓ 活跃' : '✗ 未启用'}
          </span>
        </div>
      </div>
    </div>
  `
}

const data = [
  // 第一层 - 多个顶级分类（水平对齐布局）
  { name: "前端开发", level: 1, x: 0, y: 0 },
  { name: "后端开发", level: 1, x: 0, y: 1 },
  { name: "数据分析", level: 1, x: 0, y: 2 },
  { name: "移动开发", level: 1, x: 0, y: 3 },
  { name: "运维部署", level: 1, x: 0, y: 4 },
  
  // 第二层 - 技术分类（与第一层水平对齐）- 添加动物图标和详细信息
  { 
    name: "编程语言", 
    level: 2, 
    x: 2, 
    y: 0, 
    icon: "🦁", 
    color: "#FF6B6B",
    id: "programming-languages",
    details: {
      title: "编程语言技术栈",
      description: "现代Web开发的核心编程语言",
      technologies: ["JavaScript", "TypeScript", "Python", "Java", "Go"],
      popularity: 95,
      trend: "上升",
      lastUpdate: "2024-01"
    }
  },
  { 
    name: "框架库", 
    level: 2, 
    x: 2, 
    y: 1, 
    icon: "🐘", 
    color: "#4ECDC4",
    id: "frameworks",
    details: {
      title: "前后端框架生态",
      description: "提升开发效率的框架和库",
      technologies: ["Vue.js", "React", "Angular", "Express", "Django"],
      popularity: 88,
      trend: "稳定",
      lastUpdate: "2024-01"
    }
  },
  { 
    name: "开发工具", 
    level: 2, 
    x: 2, 
    y: 2, 
    icon: "🦅", 
    color: "#45B7D1",
    id: "dev-tools",
    details: {
      title: "开发工具链",
      description: "现代化的开发环境和工具",
      technologies: ["VS Code", "Git", "Docker", "Webpack", "Vite"],
      popularity: 92,
      trend: "上升",
      lastUpdate: "2024-01"
    }
  },
  { 
    name: "数据库", 
    level: 2, 
    x: 2, 
    y: 3, 
    icon: "🐋", 
    color: "#96CEB4",
    id: "databases",
    details: {
      title: "数据存储方案",
      description: "关系型和非关系型数据库",
      technologies: ["PostgreSQL", "MongoDB", "Redis", "MySQL", "Elasticsearch"],
      popularity: 85,
      trend: "稳定",
      lastUpdate: "2024-01"
    }
  },
  { 
    name: "可视化", 
    level: 2, 
    x: 2, 
    y: 4, 
    icon: "🦋", 
    color: "#FFEAA7",
    id: "visualization",
    details: {
      title: "数据可视化技术",
      description: "将数据转化为直观的图表和交互",
      technologies: ["D3.js", "Chart.js", "ECharts", "Three.js", "WebGL"],
      popularity: 78,
      trend: "上升",
      lastUpdate: "2024-01"
    }
  },
  { 
    name: "测试工具", 
    level: 2, 
    x: 2, 
    y: 5, 
    icon: "🐝", 
    color: "#DDA0DD",
    id: "testing-tools",
    details: {
      title: "质量保障体系",
      description: "确保代码质量和系统稳定性",
      technologies: ["Jest", "Cypress", "Selenium", "Mocha", "Puppeteer"],
      popularity: 82,
      trend: "稳定",
      lastUpdate: "2024-01"
    }
  }
]

// 定义连接关系 - 第一层到第二层的多对多关系
const connections = [
  // 前端开发 (0) 连接到多个二层节点
  { source: 0, target: 5 },  // 前端开发 → 编程语言
  { source: 0, target: 6 },  // 前端开发 → 框架库
  { source: 0, target: 7 },  // 前端开发 → 开发工具
  { source: 0, target: 9 },  // 前端开发 → 可视化
  { source: 0, target: 10 }, // 前端开发 → 测试工具
  
  // 后端开发 (1) 连接到多个二层节点
  { source: 1, target: 5 },  // 后端开发 → 编程语言
  { source: 1, target: 6 },  // 后端开发 → 框架库
  { source: 1, target: 7 },  // 后端开发 → 开发工具
  { source: 1, target: 8 },  // 后端开发 → 数据库
  { source: 1, target: 10 }, // 后端开发 → 测试工具
  
  // 数据分析 (2) 连接到多个二层节点
  { source: 2, target: 5 },  // 数据分析 → 编程语言
  { source: 2, target: 7 },  // 数据分析 → 开发工具
  { source: 2, target: 8 },  // 数据分析 → 数据库
  { source: 2, target: 9 },  // 数据分析 → 可视化
  
  // 移动开发 (3) 连接到多个二层节点
  { source: 3, target: 5 },  // 移动开发 → 编程语言
  { source: 3, target: 6 },  // 移动开发 → 框架库
  { source: 3, target: 7 },  // 移动开发 → 开发工具
  { source: 3, target: 10 }, // 移动开发 → 测试工具
  
  // 运维部署 (4) 连接到多个二层节点
  { source: 4, target: 7 },  // 运维部署 → 开发工具
  { source: 4, target: 8 },  // 运维部署 → 数据库
  { source: 4, target: 10 }  // 运维部署 → 测试工具
]

let svg = null
let zoom = null

const createChart = () => {
  if (!chartContainer.value) return

  // 清除之前的图表
  d3.select(chartContainer.value).selectAll('*').remove()

  const width = 1500 // 进一步增加宽度以容纳DOM元素
  const height = 800  // 增加高度
  const cellSize = 250 // 更大的网格单元大小
  const nodeSize = 240 // 更大的节点大小以容纳DOM元素

  svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(50, 50)`)

  // 随机颜色生成器
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // 为每个连接分配随机颜色
  const linkColors = connections.map(() => getRandomColor())

  // 平滑曲线生成器
  const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveCatmullRom.alpha(0.3)) // 降低alpha值使曲线更平滑

  // 生成连接路径的控制点（现在所有连接都是第一层到第二层）
  function generatePath(source, target) {
    const sx = source.x * cellSize + nodeSize / 2
    const sy = source.y * cellSize + nodeSize / 2
    const tx = target.x * cellSize + nodeSize / 2
    const ty = target.y * cellSize + nodeSize / 2
    
    // 在50%处水平切换的平滑曲线
    const midX = (sx + tx) / 2
    
    return [
      { x: sx, y: sy },                    // 起点
      { x: sx + (midX - sx) * 0.7, y: sy }, // 第一个控制点，保持水平
      { x: midX, y: sy },                   // 中点，完全水平
      { x: midX, y: ty },                   // 垂直切换点
      { x: tx - (tx - midX) * 0.3, y: ty }, // 第二个控制点，保持水平
      { x: tx, y: ty }                      // 终点
    ]
  }

  // 绘制连接线
  const links = g.selectAll('.link')
    .data(connections)
    .enter().append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', (d, i) => linkColors[i])
    .attr('stroke-width', 20)  // 统一20px宽度
    .attr('stroke-opacity', 0.8)  // 统一透明度
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('d', d => {
      const source = data[d.source]
      const target = data[d.target]
      const pathPoints = generatePath(source, target)
      return line(pathPoints)
    })

  // 绘制节点组
  const nodes = g.selectAll('.node')
    .data(data)
    .enter().append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x * cellSize}, ${d.y * cellSize})`)

  // 添加方形节点
  nodes.append('rect')
    .attr('width', nodeSize)
    .attr('height', nodeSize)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', d => {
      if (d.color) return d.color  // 使用自定义颜色
      const levelColors = ['#E74C3C', '#3498DB']  // 红色(第一层)，蓝色(第二层)
      return levelColors[d.level - 1] || '#95A5A6'
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .style('cursor', 'pointer')
    .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))')
    .style('transition', 'all 0.2s ease')
    .on('mouseover', function(event, d) {
      const node = d3.select(this.parentNode)
      // 节点放大效果
      d3.select(this)
        .style('transform', 'scale(1.1)')
        .style('filter', 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))')
      
      // 如果有图标，让图标跳动
      if (d.icon) {
        node.select('text').filter(function() {
          return d3.select(this).text() === d.icon
        })
        .transition()
        .duration(200)
        .style('transform', 'scale(1.3)')
        .transition()
        .duration(200)
        .style('transform', 'scale(1)')
      }
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .style('transform', 'scale(1)')
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))')
    })


  // 第一层节点 - 简单文本
  nodes.filter(d => d.level === 1).append('text')
    .attr('x', nodeSize / 2)
    .attr('y', nodeSize / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#fff')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
    .text(d => d.name)
    .call(wrap, nodeSize - 10)

  // 第二层节点 - 使用foreignObject嵌入HTML DOM元素
  const secondLevelNodes = nodes.filter(d => d.level === 2 && d.details)
  
  secondLevelNodes.append('foreignObject')
    .attr('x', 5)
    .attr('y', 5)
    .attr('width', nodeSize - 10)
    .attr('height', nodeSize - 10)
    .html(d => generateNodeHTML(d))

  // 文字换行函数
  function wrap(text, width) {
    text.each(function() {
      const text = d3.select(this)
      const words = text.text().split(/\s+/).reverse()
      let word
      let line = []
      let lineNumber = 0
      const lineHeight = 1.1
      const y = text.attr('y')
      const dy = 0
      let tspan = text.text(null).append('tspan').attr('x', nodeSize / 2).attr('y', y).attr('dy', dy + 'em')
      
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(' '))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          tspan = text.append('tspan').attr('x', nodeSize / 2).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
        }
      }
    })
  }

  // 描述文字换行函数（更紧凑）
  function wrapDescription(text, width) {
    text.each(function() {
      const text = d3.select(this)
      const fullText = text.text()
      
      // 限制描述文字长度
      if (fullText.length > 30) {
        text.text(fullText.substring(0, 27) + '...')
      }
    })
  }

  // 添加入场动画
  links
    .style('opacity', 0)
    .style('stroke-dasharray', function() {
      return this.getTotalLength() + ' ' + this.getTotalLength()
    })
    .style('stroke-dashoffset', function() {
      return this.getTotalLength()
    })
    .transition()
    .delay((d, i) => i * 100)  // 统一延迟
    .duration(1200)  // 统一动画时长
    .style('opacity', 0.8)  // 统一透明度
    .style('stroke-dashoffset', 0)

  nodes.selectAll('rect')
    .attr('transform', 'scale(0)')
    .transition()
    .delay((d, i) => i * 150)
    .duration(600)
    .attr('transform', 'scale(1)')

  // 文本和图标的入场动画
  nodes.selectAll('text')
    .style('opacity', 0)
    .transition()
    .delay((d, i) => i * 150 + 300)
    .duration(600)
    .style('opacity', 1)

  // 添加缩放功能
  zoom = d3.zoom()
    .scaleExtent([0.1, 2])
    .on('zoom', function(event) {
      g.attr('transform', `translate(50, 50) ${event.transform}`)
    })

  svg.call(zoom)

  // 添加说明文字
  svg.append('text')
    .attr('x', 10)
    .attr('y', 25)
    .style('font-size', '12px')
    .style('fill', '#666')
    .text('💡 提示：第二层节点内嵌DOM元素☑️，复选框、下拉选择器、按钮、表格，动物图标🦁🐘🦅🐋🦋🐝，支持缩放拖拽')
}

onMounted(() => {
  // 设置全局事件处理函数
  window.handleNodeCheckbox = handleCheckboxChange
  window.handleNodePriority = handlePriorityChange
  window.handleNodeAction = handleActionClick
  window.handleFeatureChange = handleFeatureChange
  
  createChart()
})

onUnmounted(() => {
  // 清理全局事件处理函数
  delete window.handleNodeCheckbox
  delete window.handleNodePriority
  delete window.handleNodeAction
  delete window.handleFeatureChange
  
  if (svg) {
    svg.remove()
  }
})
</script>

<style scoped>
.mind-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  gap: 20px;
}

.chart {
  flex: 1;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto; /* 支持滚动查看大尺寸图表 */
}

.debug-panel {
  width: 300px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
  font-size: 12px;
}

.debug-panel h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

.debug-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-item {
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.debug-item strong {
  display: block;
  color: #555;
  margin-bottom: 4px;
  font-size: 11px;
}

.enabled {
  color: #28a745;
  font-weight: 500;
}

.disabled {
  color: #dc3545;
  font-weight: 500;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.feature-on {
  background: #d4edda;
  color: #155724;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.feature-off {
  background: #f8d7da;
  color: #721c24;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 10px;
}

/* 调试面板滚动条样式 */
.debug-panel::-webkit-scrollbar {
  width: 6px;
}

.debug-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.debug-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.debug-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
