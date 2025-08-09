<template>
  <div ref="chartContainer" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)

const data = [
  { name: '苹果', value: 30 },
  { name: '香蕉', value: 25 },
  { name: '橙子', value: 20 },
  { name: '葡萄', value: 15 },
  { name: '其他', value: 10 }
]

let svg = null

const createChart = () => {
  if (!chartContainer.value) return

  // 清除之前的图表
  d3.select(chartContainer.value).selectAll('*').remove()

  const width = 600
  const height = 400
  const radius = Math.min(width, height) / 2 - 40

  svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const color = d3.scaleOrdinal(d3.schemeSet3)

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null)

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)

  const arcs = g.selectAll('.arc')
    .data(pie(data))
    .enter().append('g')
    .attr('class', 'arc')

  // 饼图扇形
  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i))
    .transition()
    .duration(1000)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
      return function(t) {
        return arc(interpolate(t))
      }
    })

  // 标签
  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(d => `${d.data.name}\n${d.data.value}%`)
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
