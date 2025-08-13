<template>
  <div class="container">
    <div class="header">
      <h1>D3.js 基础示例</h1>
      <p>使用 Vue + Vite 构建的交互式数据可视化示例</p>
    </div>
    
    <nav class="nav">
      <button 
        v-for="chart in chartTypes" 
        :key="chart.id"
        class="nav-btn" 
        :class="{ active: activeChart === chart.id }"
        @click="activeChart = chart.id"
      >
        {{ chart.name }}
      </button>
    </nav>

    <div class="content">
      <!-- 柱状图示例 -->
      <div v-show="activeChart === 'bar-chart'" class="example">
        <h2 class="chart-title">柱状图示例</h2>
        <div class="chart-container">
          <BarChart />
        </div>
      </div>

      <!-- 折线图示例 -->
      <div v-show="activeChart === 'line-chart'" class="example">
        <h2 class="chart-title">折线图示例</h2>
        <div class="chart-container">
          <LineChart />
        </div>
      </div>

      <!-- 散点图示例 -->
      <div v-show="activeChart === 'scatter-plot'" class="example">
        <h2 class="chart-title">散点图示例</h2>
        <div class="chart-container">
          <ScatterPlot />
        </div>
      </div>

      <!-- 饼图示例 -->
      <div v-show="activeChart === 'pie-chart'" class="example">
        <h2 class="chart-title">饼图示例</h2>
        <div class="chart-container">
          <PieChart />
        </div>
      </div>

      <!-- 力导向图示例 -->
      <div v-show="activeChart === 'force-diagram'" class="example">
        <h2 class="chart-title">力导向图示例</h2>
        <div class="chart-container">
          <ForceDiagram />
        </div>
      </div>

      <!-- 思维导图示例 -->
      <div v-show="activeChart === 'mind-map'" class="example">
        <h2 class="chart-title">思维导图示例</h2>
        <div class="chart-container">
          <MindMap />
        </div>
      </div>

      <!-- 桑基图示例 -->
      <div v-show="activeChart === 'sankey-chart'" class="example">
        <h2 class="chart-title">桑基图示例</h2>
        <div class="chart-container">
          <SankeyChart />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BarChart from './components/BarChart.vue'
import LineChart from './components/LineChart.vue'
import ScatterPlot from './components/ScatterPlot.vue'
import PieChart from './components/PieChart.vue'
import ForceDiagram from './components/ForceDiagram.vue'
import MindMap from './components/MindMap.vue'
import SankeyChart from './components/SankeyChart.vue'

const activeChart = ref('bar-chart')

const chartTypes = [
  { id: 'bar-chart', name: '柱状图' },
  { id: 'line-chart', name: '折线图' },
  { id: 'scatter-plot', name: '散点图' },
  { id: 'pie-chart', name: '饼图' },
  { id: 'force-diagram', name: '力导向图' },
  { id: 'mind-map', name: '思维导图' },
  { id: 'sankey-chart', name: '桑基图' }
]
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.header p {
  margin: 10px 0 0 0;
  opacity: 0.9;
}

.nav {
  display: flex;
  justify-content: center;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0;
}

.nav button {
  background: none;
  border: none;
  padding: 15px 25px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.nav button:hover {
  background: #f8f9fa;
  border-bottom-color: #667eea;
}

.nav button.active {
  background: #f8f9fa;
  border-bottom-color: #667eea;
  color: #667eea;
  font-weight: 500;
}

.content {
  padding: 30px;
}

.example {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.chart-container {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 20px 0;
  padding: 20px;
  overflow-x: auto;
  overflow-y: auto;
}

.chart-title {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 15px;
  color: #333;
}
</style>
