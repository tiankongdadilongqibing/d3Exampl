<template>
  <div ref="chartContainer" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)

// 生成随机数据
const data = Array.from({ length: 50 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 20 + 5
}))

let svg = null

const createChart = () => {
  if (!chartContainer.value) return

  // 清除之前的图表
  d3.select(chartContainer.value).selectAll('*').remove()

  const margin = { top: 20, right: 30, bottom: 40, left: 40 }
  const width = 600 - margin.left - margin.right
  const height = 400 - margin.bottom - margin.top

  svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear()
    .rangeRound([0, width])
    .domain([0, 100])

  const y = d3.scaleLinear()
    .rangeRound([height, 0])
    .domain([0, 100])

  const color = d3.scaleOrdinal(d3.schemeCategory10)

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))

  // Y轴
  g.append('g')
    .call(d3.axisLeft(y))

  // 散点
  g.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.x))
    .attr('cy', d => y(d.y))
    .attr('r', 0)
    .attr('fill', (d, i) => color(i % 10))
    .attr('opacity', 0.7)
    .transition()
    .delay((d, i) => i * 50)
    .duration(500)
    .attr('r', d => d.size)
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (svg) {
    svg.remove()
  }
})
</script>

<style scoped>
.chart {
  width: 100%;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
