<template>
  <div ref="chartContainer" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)

const data = [
  { date: new Date('2023-01'), value: 30 },
  { date: new Date('2023-02'), value: 45 },
  { date: new Date('2023-03'), value: 35 },
  { date: new Date('2023-04'), value: 60 },
  { date: new Date('2023-05'), value: 55 },
  { date: new Date('2023-06'), value: 80 },
  { date: new Date('2023-07'), value: 75 },
  { date: new Date('2023-08'), value: 90 },
  { date: new Date('2023-09'), value: 85 },
  { date: new Date('2023-10'), value: 95 }
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

  const x = d3.scaleTime()
    .rangeRound([0, width])
    .domain(d3.extent(data, d => d.date))

  const y = d3.scaleLinear()
    .rangeRound([height, 0])
    .domain([0, d3.max(data, d => d.value)])

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX)

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%m月')))

  // Y轴
  g.append('g')
    .call(d3.axisLeft(y))

  // 折线
  const path = g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#667eea')
    .attr('stroke-width', 2)
    .attr('d', line)

  // 添加动画
  const totalLength = path.node().getTotalLength()
  path
    .attr('stroke-dasharray', totalLength + ' ' + totalLength)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(2000)
    .attr('stroke-dashoffset', 0)

  // 数据点
  g.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.value))
    .attr('r', 0)
    .attr('fill', '#667eea')
    .transition()
    .delay((d, i) => i * 200)
    .duration(500)
    .attr('r', 4)
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
