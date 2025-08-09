<template>
  <div ref="chartContainer" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)

const nodes = [
  { id: 'A', group: 1 },
  { id: 'B', group: 1 },
  { id: 'C', group: 1 },
  { id: 'D', group: 2 },
  { id: 'E', group: 2 },
  { id: 'F', group: 2 },
  { id: 'G', group: 3 },
  { id: 'H', group: 3 }
]

const links = [
  { source: 'A', target: 'B' },
  { source: 'B', target: 'C' },
  { source: 'C', target: 'D' },
  { source: 'D', target: 'E' },
  { source: 'E', target: 'F' },
  { source: 'F', target: 'G' },
  { source: 'G', target: 'H' },
  { source: 'A', target: 'D' },
  { source: 'B', target: 'E' },
  { source: 'C', target: 'F' }
]

let svg = null
let simulation = null

const createChart = () => {
  if (!chartContainer.value) return

  // 清除之前的图表
  d3.select(chartContainer.value).selectAll('*').remove()

  const width = 600
  const height = 400

  svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const color = d3.scaleOrdinal(d3.schemeCategory10)

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(50))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))

  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 2)

  const node = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', 15)
    .attr('fill', d => color(d.group))
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))

  const text = svg.append('g')
    .selectAll('text')
    .data(nodes)
    .enter().append('text')
    .text(d => d.id)
    .attr('font-size', '12px')
    .attr('text-anchor', 'middle')
    .attr('dy', 4)

  simulation
    .on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      text
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    })

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (simulation) {
    simulation.stop()
  }
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
