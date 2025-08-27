<template>
  <div class="sankey-chart">
    <h2>桑基图 (Sankey Diagram)</h2>
    <div class="chart-controls">
      <span v-if="activeNodeId" class="active-info">当前激活: {{ activeNodeId }}</span>
      <span class="hint">点击空白区域可取消高亮</span>
      <button @click="showExtraNodePanel = !showExtraNodePanel" class="control-btn">添加节点</button>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
    
    <!-- 额外节点面板 -->
    <div v-if="showExtraNodePanel" class="extra-node-panel">
      <h3>添加额外节点</h3>
      <div class="extra-node-form">
        <div class="form-group">
          <label>节点名称:</label>
          <input v-model="newNodeName" type="text" placeholder="输入节点名称" />
        </div>
        <div class="form-group">
          <label>分组:</label>
          <select v-model="newNodeGroup">
            <option value="0">Group 0 (目标)</option>
            <option value="1">Group 1 (技术)</option>
            <option value="2">Group 2 (领域)</option>
          </select>
        </div>
        <div class="form-group">
          <label>数值:</label>
          <input v-model="newNodeValue" type="number" min="1" max="100" />
        </div>
        <button @click="addNewExtraNode" class="add-btn">添加节点</button>
      </div>
      
      <div class="extra-nodes-list">
        <h4>已添加的额外节点</h4>
        <div v-for="node in extraNodes" :key="node.id" class="extra-node-item">
          <span>{{ node.name }} (Group {{ node.group }})</span>
          <button @click="removeExtraNode(node.id)" class="remove-btn">删除</button>
        </div>
      </div>
    </div>

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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from '../utils/sankeyUtils'
import { customColors } from '../utils/color'

// 自定义颜色数组 - 可以根据需要调整颜色
// 方案1: 经典配色（当前使用）

const chartContainer = ref(null)
const activeNodeId = ref(null)
const showExtraNodePanel = ref(false)
const newNodeName = ref('')
const newNodeGroup = ref('0')
const newNodeValue = ref(1)
// 保存布局后的节点，便于按 id 定位节点（含 group/value 等信息）
let idToNode = {}
// 各分组的最大 value（用于 group=2 的进度条归一化）
let groupMaxValue = { 0: 0, 1: 0, 2: 0 }
// 连接线宽度缩放函数（在布局完成后赋值，供重置时复用）
let linkWidthScaleRef = null
// 颜色函数（与连接线保持一致）
let colorFunction = null

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
  "数据分析": { enabled: false, priority: "中", features: { "报表": true, "仪表板": false, "实时": true } },
  "EChartss": { enabled: false, priority: "低", features: { "图表类型": true, "主题": false, "导出": true } },
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
    { id: "EChartss", group: 1 },
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

// 生成节点HTML内容（按 group 区分）
const generateNodeHTML = (d, color) => {
  const nodeState = nodeStates.value[d.id] || { enabled: false, priority: '中', features: {} }
  const nodeColor = color(d.id) // 使用与连接线相同的颜色逻辑

  // 额外节点的特殊样式
  if (d.isExtra) {
    return `
      <div style="
        width: 100%;
        height: 100%;
        padding: 2px 4px;
        background: #f0f0f0;
        border: 1px dashed #999;
        border-radius: 4px;
        color: #666;
        font-family: Arial, sans-serif;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        cursor: default;
        overflow: hidden;
        text-align: center;
      ">
        <span style="font-weight: bold; color: #333;">${d.name}</span>
        <span style="margin-left: 4px; font-size: 8px; color: #999;">(额外)</span>
      </div>
    `
  }

  // group = 2: 蓝条灰底进度条
  if (d.group === 2) {
    const maxVal = groupMaxValue[2] || 1
    const percent = Math.max(0, Math.min(1, (d.value || 0) / maxVal))
    const percentText = Math.round(percent * 100) + '%'
    return `
      <div style="width:100%;height:100%;box-sizing:border-box;padding:2px 4px;background:#f7f7f7;border:1px solid #bbb;border-radius:4px;font-family:Arial,sans-serif;font-size:10px;color:#333;display:flex;align-items:center;gap:6px;">
        <div style="flex:0 0 auto;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:bold;color:#333;">${d.id}</div>
        <div style="flex:1 1 auto;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;border:1px solid #d0d0d0;position:relative;">
          <div style="width:${percent*100}%;height:100%;background:#2196f3;"></div>
          <div style="position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;text-shadow:0 1px 0 rgba(0,0,0,0.2);">${percentText}</div>
        </div>
      </div>
    `
  }

  // group = 1: 外层展示标题，内层白底说明文字
  if (d.group === 1) {
    const enabledFeatures = Object.entries(nodeState.features || {})
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ')
    const description = `优先级: ${nodeState.priority}；已启用特性: ${enabledFeatures || '无'}`
    return `
      <div style="width:100%;height:100%;box-sizing:border-box;border:1px solid #333;border-radius:4px;overflow:hidden;font-family:Arial,sans-serif;background:${nodeColor};color:#fff;display:flex;align-items:stretch;">
        <div style="flex:0 0 100px;display:flex;align-items:center;justify-content:flex-start;padding:6px 10px;font-weight:bold;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.id}</div>
        <div style="flex:1;display:flex;align-items:center;padding:6px;">
          <div style="width:100%;background:#fff;color:#333;border-radius:3px;padding:6px 8px;font-size:9px;line-height:1.4;">
            ${description}
          </div>
        </div>
      </div>
    `
  }

  // 其他（group = 0）保留原有的交互式内容
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <strong style="font-size: 9px; line-height: 1;">${d.id}</strong>
        <label style="display: flex; align-items: center; gap: 2px; font-size: 7px;">
          <input type="checkbox" ${nodeState.enabled ? 'checked' : ''} onchange="window.handleNodeCheckbox('${d.id}', this.checked)" style="width: 10px; height: 10px;">
          <span>启用</span>
        </label>
      </div>
      <div style="margin-bottom: 2px;">
        <select onchange="window.handlePriorityChange('${d.id}', this.value)" style="width: 100%; font-size: 7px; padding: 1px; border-radius: 2px; border: none;">
          <option value="高" ${nodeState.priority === '高' ? 'selected' : ''}>高</option>
          <option value="中" ${nodeState.priority === '中' ? 'selected' : ''}>中</option>
          <option value="低" ${nodeState.priority === '低' ? 'selected' : ''}>低</option>
        </select>
      </div>
      <div style="max-height: 40px; overflow-y: auto; background: rgba(255,255,255,0.1); border-radius: 2px; padding: 1px;">
        <div style="font-size: 6px; margin-bottom: 1px; text-align: center;">特性</div>
        ${Object.entries(nodeState.features || {}).map(([feature, enabled]) => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; font-size: 6px; line-height: 1;">
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${feature}</span>
            <input type="checkbox" ${enabled ? 'checked' : ''} onchange="window.handleFeatureChange('${d.id}', '${feature}', this.checked)" style="width: 6px; height: 6px; margin-left: 2px;">
          </div>
        `).join('')}
      </div>
      <div style="display: flex; gap: 1px; margin-top: 2px;">
        <button onclick="window.handleActionClick('${d.id}', 'config')" style="flex: 1; font-size: 6px; padding: 1px; border: none; border-radius: 1px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; line-height: 1;">配置</button>
        <button onclick="window.handleActionClick('${d.id}', 'deploy')" style="flex: 1; font-size: 6px; padding: 1px; border: none; border-radius: 1px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; line-height: 1;">部署</button>
      </div>
      <div style="text-align: center; font-size: 6px; margin-top: 1px;">
        <span style="padding: 1px 3px; border-radius: 1px; background: ${nodeState.enabled ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'}; display: inline-block; line-height: 1;">${nodeState.enabled ? '✓ 活跃' : '✗ 未启用'}</span>
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
    const nodeData = idToNode[nodeId] || { id: nodeId, group: 0, value: 0 }
    node.html(generateNodeHTML(nodeData, colorFunction))
  }
}

// 设置全局事件处理器
const setupGlobalHandlers = () => {
  window.handleNodeCheckbox = handleNodeCheckbox
  window.handlePriorityChange = handlePriorityChange
  window.handleFeatureChange = handleFeatureChange
  window.handleActionClick = handleActionClick
}

// 重新渲染图表的方法
const renderChart = () => {
  if (!chartContainer.value) return
  
  // 清空现有内容
  d3.select(chartContainer.value).selectAll("*").remove()
  
  // 重新初始化图表
  initializeChart()
}

// 添加额外节点的方法
const addExtraNode = (nodeName, group, value = 1) => {
  // 创建新的额外节点
  const extraNode = {
    id: `extra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: nodeName,
    group: group,
    value: value,
    isExtra: true // 标记为额外节点
  }
  
  // 添加到数据中
  data.nodes.push(extraNode)
  
  // 重新渲染图表
  renderChart()
}

// 移除额外节点的方法
const removeExtraNode = (nodeId) => {
  const index = data.nodes.findIndex(node => node.id === nodeId && node.isExtra)
  if (index !== -1) {
    data.nodes.splice(index, 1)
    renderChart()
  }
}

// 获取所有额外节点
const getExtraNodes = () => {
  return data.nodes.filter(node => node.isExtra)
}

// 计算属性：获取所有额外节点
const extraNodes = computed(() => {
  return data.nodes.filter(node => node.isExtra)
})

// 添加新额外节点的方法
const addNewExtraNode = () => {
  if (!newNodeName.value.trim()) {
    alert('请输入节点名称')
    return
  }
  
  addExtraNode(
    newNodeName.value.trim(),
    parseInt(newNodeGroup.value),
    parseInt(newNodeValue.value)
  )
  
  // 清空表单
  newNodeName.value = ''
  newNodeGroup.value = '0'
  newNodeValue.value = 1
}

// 响应式调整函数
const resizeChart = () => {
  if (!chartContainer.value) return
  
  const container = chartContainer.value
  const containerRect = container.getBoundingClientRect()
  const width = Math.max(containerRect.width || 1400, 800)  // 最小宽度 800px
  const height = Math.max(containerRect.height || 800, 600) // 最小高度 600px
  
  const svg = d3.select(chartContainer.value).select("svg")
  if (!svg.empty()) {
    // 只调整宽度，保持原始高度
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
    
    // 重新计算布局以适应新宽度
    const sankeyLayout = sankey()
      .nodeWidth(Math.min(240, width * 0.15))  // 节点宽度根据容器宽度调整
      .nodePadding(24) // 保持固定的节点间距
      .extent([[1, 1], [width - 1, height - 5]])
    
    // 分离原始节点和额外节点
    const originalNodes = data.nodes.filter(node => !node.isExtra)
    const extraNodes = data.nodes.filter(node => node.isExtra)
    
    // 为每个group计算额外节点的位置
    const groupExtraNodes = {}
    extraNodes.forEach(node => {
      if (!groupExtraNodes[node.group]) {
        groupExtraNodes[node.group] = []
      }
      groupExtraNodes[node.group].push(node)
    })
    
    // 计算原始节点的布局
    const { nodes: originalLayoutNodes, links } = sankeyLayout({
      nodes: originalNodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    })
    
    // 为额外节点计算位置
    const allNodes = [...originalLayoutNodes]
    Object.keys(groupExtraNodes).forEach(group => {
      const groupNodes = originalLayoutNodes.filter(n => n.group === parseInt(group))
      const extraNodesInGroup = groupExtraNodes[group]
      
      if (extraNodesInGroup.length > 0) {
        const nodeHeight = 24 // 额外节点的高度
        const padding = 8 // 额外节点之间的间距
        
        if (groupNodes.length > 0) {
          // 如果该group有原始节点，找到最下方的节点作为参考
          const bottomNode = groupNodes.reduce((max, node) => 
            node.y1 > max.y1 ? node : max, groupNodes[0])
          
          extraNodesInGroup.forEach((extraNode, index) => {
            const extraNodeLayout = {
              ...extraNode,
              x0: bottomNode.x0,
              x1: bottomNode.x1,
              y0: bottomNode.y1 + padding + index * (nodeHeight + padding),
              y1: bottomNode.y1 + padding + (index + 1) * nodeHeight + index * padding,
              value: extraNode.value
            }
            allNodes.push(extraNodeLayout)
          })
        } else {
          // 如果该group没有原始节点，根据group计算默认位置
          const groupNum = parseInt(group)
          const defaultX0 = groupNum * (width / 3) + 50 // 根据group分布在不同列
          const defaultX1 = defaultX0 + Math.min(240, width * 0.15) // 使用默认节点宽度
          const startY = 100 + groupNum * 50 // 不同group有不同的起始Y位置
          
          extraNodesInGroup.forEach((extraNode, index) => {
            const extraNodeLayout = {
              ...extraNode,
              x0: defaultX0,
              x1: defaultX1,
              y0: startY + index * (nodeHeight + padding),
              y1: startY + (index + 1) * nodeHeight + index * padding,
              value: extraNode.value
            }
            allNodes.push(extraNodeLayout)
          })
        }
      }
    })
    
    const nodes = allNodes
    
    // 更新节点位置
    const nodeGroup = svg.select("g").selectAll(".node")
    nodeGroup
      .attr("x", d => d.x0)
      .attr("y", d => d.group === 2 ? d.y0 + Math.max(0, (d.y1 - d.y0 - 24) / 2) : d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.group === 2 ? 24 : (d.y1 - d.y0))
    
    // 更新连接线
    const linkGroup = svg.select("g").selectAll(".link")
    linkGroup.attr("d", sankeyLinkHorizontal())
    
    // 更新标签位置
    const labelGroup = svg.select("g").selectAll(".node-label")
    labelGroup
      .attr("x", d => d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("text-anchor", d => d.x0 < width / 2 ? "end" : "start")
  }
}

// 初始化图表的方法
const initializeChart = () => {
  // 获取容器尺寸
  const container = chartContainer.value
  const containerRect = container.getBoundingClientRect()
  const width = containerRect.width || 1400
  const height = containerRect.height || 800

  const color = d3.scaleOrdinal(customColors)
  colorFunction = color

  const svg = d3.select(chartContainer.value)
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("font", "12px sans-serif")
    .on("click", (event) => {
      // 检查点击的是否是空白区域（不是节点或连接线）
      const target = event.target
      if (target.tagName === 'svg' || target.classList.contains('chart-container')) {
        resetHighlight()
      }
    })

  const g = svg.append("g")

    // 分离原始节点和额外节点
  const originalNodes = data.nodes.filter(node => !node.isExtra)
  const extraNodes = data.nodes.filter(node => node.isExtra)
  
  // 为每个group计算额外节点的位置
  const groupExtraNodes = {}
  extraNodes.forEach(node => {
    if (!groupExtraNodes[node.group]) {
      groupExtraNodes[node.group] = []
    }
    groupExtraNodes[node.group].push(node)
  })
  
  // 创建桑基图布局
  const sankeyLayout = sankey()
    .nodeWidth(Math.min(240, width * 0.15))  // 节点宽度根据容器宽度调整
    .nodePadding(24) // 保持固定的节点间距
    .extent([[1, 1], [width - 1, height - 5]])
  
  // 计算原始节点的布局
  const { nodes: originalLayoutNodes, links } = sankeyLayout({
    nodes: originalNodes.map(d => Object.assign({}, d)),
    links: data.links.map(d => Object.assign({}, d))
  })
  
  // 为额外节点计算位置
  const allNodes = [...originalLayoutNodes]
  Object.keys(groupExtraNodes).forEach(group => {
    const groupNodes = originalLayoutNodes.filter(n => n.group === parseInt(group))
    const extraNodesInGroup = groupExtraNodes[group]
    
    if (extraNodesInGroup.length > 0) {
      const nodeHeight = 24 // 额外节点的高度
      const padding = 8 // 额外节点之间的间距
      
      if (groupNodes.length > 0) {
        // 如果该group有原始节点，找到最下方的节点作为参考
        const bottomNode = groupNodes.reduce((max, node) => 
          node.y1 > max.y1 ? node : max, groupNodes[0])
        
        extraNodesInGroup.forEach((extraNode, index) => {
          const extraNodeLayout = {
            ...extraNode,
            x0: bottomNode.x0,
            x1: bottomNode.x1,
            y0: bottomNode.y1 + padding + index * (nodeHeight + padding),
            y1: bottomNode.y1 + padding + (index + 1) * nodeHeight + index * padding,
            value: extraNode.value
          }
          allNodes.push(extraNodeLayout)
        })
      } else {
        // 如果该group没有原始节点，根据group计算默认位置
        const groupNum = parseInt(group)
        const defaultX0 = groupNum * (width / 3) + 50 // 根据group分布在不同列
        const defaultX1 = defaultX0 + Math.min(240, width * 0.15) // 使用默认节点宽度
        const startY = 100 + groupNum * 50 // 不同group有不同的起始Y位置
        
        extraNodesInGroup.forEach((extraNode, index) => {
          const extraNodeLayout = {
            ...extraNode,
            x0: defaultX0,
            x1: defaultX1,
            y0: startY + index * (nodeHeight + padding),
            y1: startY + (index + 1) * nodeHeight + index * padding,
            value: extraNode.value
          }
          allNodes.push(extraNodeLayout)
        })
      }
    }
  })
  
  const nodes = allNodes

  // 建立 id -> node 的索引，并计算各组最大值
  idToNode = {}
  groupMaxValue = { 0: 0, 1: 0, 2: 0 }
  nodes.forEach(n => {
    idToNode[n.id] = n
    const gKey = n.group in groupMaxValue ? n.group : 0
    const v = n.value || 0
    if (v > groupMaxValue[gKey]) groupMaxValue[gKey] = v
  })

  // 紧凑排列 group=2 节点（仅影响 group=2 的垂直间距）
  const compactHeight = 24
  const compactGap = 6
  const group2Nodes = nodes.filter(n => n.group === 2)
  if (group2Nodes.length > 0) {
    const top = d3.min(group2Nodes, n => n.y0) || 0
    group2Nodes.sort((a, b) => ((a.y0 + a.y1) / 2) - ((b.y0 + b.y1) / 2))
    group2Nodes.forEach((n, idx) => {
      const y0c = top + idx * (compactHeight + compactGap)
      const y1c = y0c + compactHeight
      n.y0 = y0c
      n.y1 = y1c
    })
  }

  // 将与 group=2 节点相连的链接锚定到节点的垂直中点
  links.forEach(l => {
    if (l.source && l.source.group === 2) {
      l.y0 = (l.source.y0 + l.source.y1) / 2
    }
    if (l.target && l.target.group === 2) {
      l.y1 = (l.target.y0 + l.target.y1) / 2
    }
  })

  // 为较小高度节点适配连接线厚度：将最大厚度压到 10px 以内
  const maxLinkThickness = d3.max(links, d => d.width) || 1
  const linkWidthScale = d3.scaleLinear().domain([0, maxLinkThickness]).range([1, 10])
  linkWidthScaleRef = linkWidthScale

  // 创建连接线
  const linkGroup = g.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.4)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", d => color(d.source.id))
    .attr("stroke-width", d => linkWidthScale(d.width))
    .attr("d", sankeyLinkHorizontal())
    .attr("class", "link")
    .attr("data-source", d => d.source.id)
    .attr("data-target", d => d.target.id)

  // 创建节点 - 使用foreignObject嵌入自定义DOM元素
  const nodeGroup = g.append("g")
    .selectAll("foreignObject")
    .data(nodes)
    .join("foreignObject")
    .attr("x", d => d.x0)
    .attr("y", d => d.group === 2 ? d.y0 + Math.max(0, (d.y1 - d.y0 - 24) / 2) : d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.group === 2 ? 24 : (d.y1 - d.y0))
    .attr("data-node-id", d => d.id)
    .attr("class", d => `node ${d.isExtra ? 'extra-node' : ''}`)
    .style("cursor", d => d.isExtra ? "default" : "pointer")
    .on("click", (event, d) => {
      if (!d.isExtra) {
        handleNodeClick(event, d)
      }
    })
    .html(d => generateNodeHTML(d, color))

  // 添加节点标签
  const labelGroup = g.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "end" : "start")
    .attr("class", "node-label")
    .attr("data-node-id", d => d.id)
    .text(d => d.id)
    .style("font-size", "11px")
    .style("font-weight", "bold")

  // 点击节点激活高亮效果
  const handleNodeClick = (event, d) => {
    // 阻止事件冒泡到SVG容器
    event.stopPropagation()
    
    const nodeId = d.id
    
    // 如果点击的是当前激活的节点，则取消激活
    if (activeNodeId.value === nodeId) {
      activeNodeId.value = null
      resetAllElements()
      return
    }
    
    // 设置新的激活节点
    activeNodeId.value = nodeId
    
    // 高亮相关连接
    linkGroup
      .style("opacity", link => 
        link.source.id === nodeId || link.target.id === nodeId ? 1 : 0.1
      )
      .style("stroke-width", link => 
        link.source.id === nodeId || link.target.id === nodeId ? 
        linkWidthScale(link.width) : Math.max(1, linkWidthScale(link.width) * 0.6)
      )
    
    // 高亮相关节点标签
    labelGroup
      .style("opacity", label => 
        label.id === nodeId ? 1 : 0.3
      )
      .style("font-weight", label => 
        label.id === nodeId ? "bold" : "normal"
      )
    
    // 高亮相关节点（包括源节点和目标节点）
    nodeGroup
      .style("opacity", node => {
        // 检查当前节点是否与激活节点有连接关系
        const hasConnection = links.some(link => 
          (link.source.id === nodeId && link.target.id === node.id) ||
          (link.target.id === nodeId && link.source.id === node.id) ||
          node.id === nodeId
        )
        return hasConnection ? 1 : 0.3
      })
  }

  const handleMouseOut = (event, d) => {
    // 恢复所有元素的默认状态
    linkGroup
      .style("opacity", 0.4)
      .style("stroke-width", d => linkWidthScale(d.width))
    
    nodeGroup.style("opacity", 1)
    
    labelGroup
      .style("opacity", 1)
      .style("font-weight", "bold")
  }

  // 为节点添加点击事件
  nodeGroup
    .on("click", handleNodeClick)

  // 为连接线添加点击事件（可选，让连接线也能触发高亮）
  linkGroup
    .on("click", (event, d) => {
      // 阻止事件冒泡到SVG容器
      event.stopPropagation()
      
      // 当点击连接线时，高亮相关的两个节点
      const sourceId = d.source.id
      const targetId = d.target.id
      
      // 如果点击的是当前激活的连接，则取消激活
      if (activeNodeId.value === sourceId || activeNodeId.value === targetId) {
        activeNodeId.value = null
        resetAllElements()
        return
      }
      
      // 设置激活节点为源节点
      activeNodeId.value = sourceId
      
      // 高亮相关连接
      linkGroup
        .style("opacity", link => 
          (link.source.id === sourceId && link.target.id === targetId) ||
          (link.source.id === targetId && link.target.id === sourceId) ? 1 : 0.1
        )
        .style("stroke-width", link => 
          (link.source.id === sourceId && link.target.id === targetId) ||
          (link.source.id === targetId && link.target.id === sourceId) ? 
          linkWidthScale(link.width) : Math.max(1, linkWidthScale(link.width) * 0.6)
        )
      
      // 高亮相关节点标签
      labelGroup
        .style("opacity", label => 
          label.id === sourceId || label.id === targetId ? 1 : 0.3
        )
        .style("font-weight", label => 
          label.id === sourceId || label.id === targetId ? "bold" : "normal"
        )
      
      // 高亮相关节点
      nodeGroup
        .style("opacity", node => 
          node.id === sourceId || node.id === targetId ? 1 : 0.3
        )
    })


  // 设置全局事件处理器
  setupGlobalHandlers()
}

onMounted(() => {
  // 初始化图表
  initializeChart()
  
  // 设置窗口大小变化监听器
  window.addEventListener('resize', resizeChart)
  
  // 使用 ResizeObserver 监听容器大小变化
  const resizeObserver = new ResizeObserver(() => {
    resizeChart()
  })
  if (chartContainer.value) {
    resizeObserver.observe(chartContainer.value)
  }
})

// 重置高亮效果
const resetHighlight = () => {
  activeNodeId.value = null
  // 重置所有元素到默认状态
  const linkGroup = d3.select(chartContainer.value).selectAll(".link")
  const nodeGroup = d3.select(chartContainer.value).selectAll(".node")
  const labelGroup = d3.select(chartContainer.value).selectAll(".node-label")
  
  if (!linkGroup.empty()) {
    linkGroup
      .style("opacity", 0.4)
      .style("stroke-width", d => (linkWidthScaleRef ? linkWidthScaleRef(d.width) : Math.max(1, d.width)))
  }
  
  if (!nodeGroup.empty()) {
    nodeGroup.style("opacity", 1)
  }
  
  if (!labelGroup.empty()) {
    labelGroup
      .style("opacity", 1)
      .style("font-weight", "bold")
  }
}

// 清理全局事件处理器
onUnmounted(() => {
  delete window.handleNodeCheckbox
  delete window.handlePriorityChange
  delete window.handleFeatureChange
  delete window.handleActionClick
  
  // 清理窗口大小变化监听器
  window.removeEventListener('resize', resizeChart)
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
  cursor: default;
  position: relative;
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

/* 鼠标悬浮高亮效果样式 */
.node {
  transition: opacity 0.3s ease;
}

.node:hover {
  cursor: pointer;
}

.link {
  transition: opacity 0.3s ease, stroke-width 0.3s ease;
}

.node-label {
  transition: opacity 0.3s ease, font-weight 0.3s ease;
}

/* 控制面板样式 */
.chart-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.active-info {
  color: #28a745;
  font-weight: bold;
  font-size: 14px;
}

.hint {
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
}

/* 额外节点面板样式 */
.extra-node-panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.extra-node-form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 15px;
  align-items: end;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.add-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.add-btn:hover {
  background: #45a049;
}

.extra-nodes-list {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.extra-nodes-list h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.extra-node-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 5px;
}

.remove-btn {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background: #d32f2f;
}

/* 额外节点样式 */
.extra-node {
  opacity: 0.8;
}

.extra-node:hover {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sankey-chart {
    padding: 10px;
  }
  
  .chart-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .debug-panel {
    padding: 15px;
  }
  
  .node-states {
    grid-template-columns: 1fr;
  }
  
  .extra-node-form {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .sankey-chart h2 {
    font-size: 18px;
  }
}
</style>
