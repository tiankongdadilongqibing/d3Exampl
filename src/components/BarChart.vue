<template>
  <div ref="chartContainer" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)

const data = [
  { name: 'A', value: 30 },
  { name: 'B', value: 80 },
  { name: 'C', value: 45 },
  { name: 'D', value: 60 },
  { name: 'E', value: 20 },
  { name: 'F', value: 90 },
  { name: 'G', value: 55 }
]

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

  const x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1)
    .domain(data.map(d => d.name))

  const y = d3.scaleLinear()
    .rangeRound([height, 0])
    .domain([0, d3.max(data, d => d.value)])

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))

  // Y轴
  g.append('g')
    .call(d3.axisLeft(y))

  // 柱子
  g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', '#667eea')
    .transition()
    .duration(800)
    .attr('y', d => y(d.value))
    .attr('height', d => height - y(d.value))

  // 添加数值标签
  g.selectAll('.label')
    .data(data)
    .enter().append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.name) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(d => d.value)
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
