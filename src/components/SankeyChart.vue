<template>
  <div class="sankey-chart">
    <h2>桑基图 (Sankey Diagram)</h2>
    <div class="chart-container" ref="chartContainer"></div>
    
    <!-- 调试面板 -->
    <div class="debug-panel">
      <h3>节点状态监控</h3>
      <div class="node-states">
        <div v-for="(state, nodeId) in nodeStates" :key="nodeId" class="node-state">
          <strong>{{ nodeId }}:</strong>
          <span class="status" :class="{ active: state.enabled, inactive: !state.enabled }">
            {{ state.enabled ? '启用' : '未启用' }}
          </span>
          <span class="priority">优先级: {{ state.priority }}</span>
          <div class="features">
            特性: {{ Object.entries(state.features).filter(([k, v]) => v).map(([k, v]) => k).join(', ') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

const chartContainer = ref(null)

// 节点状态管理
const nodeStates = ref({
  "前端开发": { enabled: true, priority: "高", features: { "响应式": true, "组件化": true, "状态管理": false } },
  "后端开发": { enabled: true, priority: "中", features: { "API设计": true, "数据库": true, "缓存": false } },
  "数据科学": { enabled: false, priority: "低", features: { "机器学习": false, "数据分析": true, "可视化": true } },
  "Vue.js": { enabled: true, priority: "高", features: { "Composition API": true, "Vuex": false, "Router": true } },
  "React": { enabled: true, priority: "中", features: { "Hooks": true, "Redux": false, "Context": true } },
  "Node.js": { enabled: true, priority: "高", features: { "Express": true, "中间件": true, "异步": true } },
  "Python": { enabled: false, priority: "低", features: { "Django": false, "Flask": true, "数据分析": true } },
  "D3.js": { enabled: true, priority: "中", features: { "动画": true, "交互": true, "自定义": true } },
  "ECharts": { enabled: false, priority: "低", features: { "图表类型": true, "主题": false, "导出": true } },
  "Web应用": { enabled: true, priority: "高", features: { "性能": true, "SEO": true, "PWA": false } },
  "数据分析": { enabled: false, priority: "中", features: { "报表": true, "仪表板": false, "实时": true } }
})

const data = {
  nodes: [
    { id: "前端开发", group: 2 },
    { id: "后端开发", group: 2 },
    { id: "数据科学", group: 2 },
    { id: "Vue.js", group: 1 },
    { id: "React", group: 1 },
    { id: "Node.js", group: 1 },
    { id: "Python", group: 1 },
    { id: "D3.js", group: 1 },
    { id: "ECharts", group: 1 },
    { id: "Web应用", group: 0 },
    { id: "数据分析", group: 0 }
  ],
  links: [
    { source: 0, target: 3, value: 40 },  // 前端开发 -> Vue.js
    { source: 0, target: 4, value: 35 },  // 前端开发 -> React
    { source: 1, target: 5, value: 45 },  // 后端开发 -> Node.js
    { source: 1, target: 6, value: 30 },  // 后端开发 -> Python
    { source: 2, target: 7, value: 30 },  // 数据科学 -> D3.js
    { source: 2, target: 8, value: 25 },  // 数据科学 -> ECharts
    { source: 3, target: 9, value: 35 },  // Vue.js -> Web应用
    { source: 4, target: 9, value: 25 },  // React -> Web应用
    { source: 5, target: 9, value: 40 },  // Node.js -> Web应用
    { source: 6, target: 10, value: 20 }, // Python -> 数据分析
    { source: 7, target: 10, value: 25 }, // D3.js -> 数据分析
    { source: 8, target: 10, value: 20 }  // ECharts -> 数据分析
  ]
}

// 生成节点HTML内容
const generateNodeHTML = (d, colorScale) => {
  const nodeState = nodeStates.value[d.id] || { enabled: false, priority: "中", features: {} }
  const nodeColor = colorScale(d.id)
  
  return `
    <div style="
      width: 100%;
      height: 100%;
      padding: 4px;
      background: ${nodeColor};
      border: 1px solid #333;
      border-radius: 4px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 9px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      cursor: pointer;
      overflow: hidden;
    ">
      <!-- 标题和启用状态 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <strong style="font-size: 9px; line-height: 1;">${d.id}</strong>
        <label style="display: flex; align-items: center; gap: 2px; font-size: 7px;">
          <input type="checkbox" 
                 ${nodeState.enabled ? 'checked' : ''} 
                 onchange="window.handleNodeCheckbox('${d.id}', this.checked)"
                 style="width: 10px; height: 10px;">
          <span>启用</span>
        </label>
      </div>
      
      <!-- 优先级选择 -->
      <div style="margin-bottom: 2px;">
        <select onchange="window.handlePriorityChange('${d.id}', this.value)" 
                style="width: 100%; font-size: 7px; padding: 1px; border-radius: 2px; border: none;">
          <option value="高" ${nodeState.priority === "高" ? 'selected' : ''}>高</option>
          <option value="中" ${nodeState.priority === "中" ? 'selected' : ''}>中</option>
          <option value="低" ${nodeState.priority === "低" ? 'selected' : ''}>低</option>
        </select>
      </div>
      
      <!-- 特性配置 -->
      <div style="max-height: 40px; overflow-y: auto; background: rgba(255,255,255,0.1); border-radius: 2px; padding: 1px;">
        <div style="font-size: 6px; margin-bottom: 1px; text-align: center;">特性</div>
        ${Object.entries(nodeState.features).map(([feature, enabled]) => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; font-size: 6px; line-height: 1;">
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${feature}</span>
            <input type="checkbox" 
                   ${enabled ? 'checked' : ''} 
                   onchange="window.handleFeatureChange('${d.id}', '${feature}', this.checked)"
                   style="width: 6px; height: 6px; margin-left: 2px;">
          </div>
        `).join('')}
      </div>
      
      <!-- 操作按钮 -->
      <div style="display: flex; gap: 1px; margin-top: 2px;">
        <button onclick="window.handleActionClick('${d.id}', 'config')" 
                style="flex: 1; font-size: 6px; padding: 1px; border: none; border-radius: 1px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; line-height: 1;">
          配置
        </button>
        <button onclick="window.handleActionClick('${d.id}', 'deploy')" 
                style="flex: 1; font-size: 6px; padding: 1px; border: none; border-radius: 1px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; line-height: 1;">
          部署
        </button>
      </div>
      
      <!-- 状态指示器 -->
      <div style="text-align: center; font-size: 6px; margin-top: 1px;">
        <span style="
          padding: 1px 3px;
          border-radius: 1px;
          background: ${nodeState.enabled ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
          display: inline-block;
          line-height: 1;
        ">
          ${nodeState.enabled ? '✓ 活跃' : '✗ 未启用'}
        </span>
      </div>
    </div>
  `
}

// 事件处理函数
const handleNodeCheckbox = (nodeId, checked) => {
  if (nodeStates.value[nodeId]) {
    nodeStates.value[nodeId].enabled = checked
    updateNodeDisplay(nodeId)
  }
}

const handlePriorityChange = (nodeId, priority) => {
  if (nodeStates.value[nodeId]) {
    nodeStates.value[nodeId].priority = priority
    updateNodeDisplay(nodeId)
  }
}

const handleFeatureChange = (nodeId, feature, enabled) => {
  if (nodeStates.value[nodeId] && nodeStates.value[nodeId].features) {
    nodeStates.value[nodeId].features[feature] = enabled
    updateNodeDisplay(nodeId)
  }
}

const handleActionClick = (nodeId, action) => {
  console.log(`节点 ${nodeId} 执行操作: ${action}`)
  alert(`节点 ${nodeId} 执行操作: ${action}`)
}

// 更新节点显示
const updateNodeDisplay = (nodeId) => {
  const node = d3.select(chartContainer.value).select(`foreignObject[data-node-id="${nodeId}"]`)
  if (!node.empty()) {
    const nodeData = { id: nodeId }
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    node.html(generateNodeHTML(nodeData, colorScale))
  }
}

// 设置全局事件处理器
const setupGlobalHandlers = () => {
  window.handleNodeCheckbox = handleNodeCheckbox
  window.handlePriorityChange = handlePriorityChange
  window.handleFeatureChange = handleFeatureChange
  window.handleActionClick = handleActionClick
}

onMounted(() => {
  const width = 1400
  const height = 800

  const color = d3.scaleOrdinal(d3.schemeCategory10)

  const svg = d3.select(chartContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font", "12px sans-serif")

  const g = svg.append("g")

  // 创建桑基图布局
  const sankeyLayout = sankey()
    .nodeWidth(120)  // 增加节点宽度
    .nodePadding(20) // 增加节点间距
    .extent([[1, 1], [width - 1, height - 5]])

  // 计算布局
  const { nodes, links } = sankeyLayout({
    nodes: data.nodes.map(d => Object.assign({}, d)),
    links: data.links.map(d => Object.assign({}, d))
  })

  // 创建连接线
  g.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.4)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", d => color(d.source.id))
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("d", sankeyLinkHorizontal())

  // 创建节点 - 使用foreignObject嵌入自定义DOM元素
  g.append("g")
    .selectAll("foreignObject")
    .data(nodes)
    .join("foreignObject")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("data-node-id", d => d.id)
    .html(d => generateNodeHTML(d, color))

  // 添加节点标签
  g.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "end" : "start")
    .text(d => d.id)
    .style("font-size", "11px")
    .style("font-weight", "bold")

  // 设置全局事件处理器
  setupGlobalHandlers()
})

// 清理全局事件处理器
onUnmounted(() => {
  delete window.handleNodeCheckbox
  delete window.handlePriorityChange
  delete window.handleFeatureChange
  delete window.handleActionClick
})
</script>

<style scoped>
.sankey-chart {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
  overflow: auto;
}

.debug-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.debug-panel h3 {
  margin-top: 0;
  color: #333;
  font-size: 16px;
}

.node-states {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.node-state {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
  font-size: 12px;
}

.node-state strong {
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.status {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  margin-right: 8px;
}

.status.active {
  background: #28a745;
  color: white;
}

.status.inactive {
  background: #dc3545;
  color: white;
}

.priority {
  color: #666;
  font-size: 10px;
}

.features {
  margin-top: 5px;
  color: #666;
  font-size: 10px;
  font-style: italic;
}
</style>
