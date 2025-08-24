/**
 * 自定义桑基图布局算法
 * 参考 d3-sankey 库实现，提供完整的桑基图布局功能
 * 参考: https://github.com/d3/d3-sankey
 */

// 默认配置
const defaultNodeWidth = 24
const defaultNodePadding = 8
const defaultExtent = [[0, 0], [1, 1]]
const defaultIterations = 6

/**
 * 创建桑基图布局生成器
 * @returns {Function} 桑基图布局函数
 */
export const sankey = () => {
  let nodeWidth = defaultNodeWidth
  let nodePadding = defaultNodePadding
  let extent = defaultExtent
  let iterations = defaultIterations
  let nodeId = (d) => d.index
  let nodeAlign = sankeyJustify
  let nodeSort = undefined
  let linkSort = undefined
  let nodes = (graph) => graph.nodes
  let links = (graph) => graph.links

  const sankeyLayout = (graph) => {
    const graphNodes = nodes(graph)
    const graphLinks = links(graph)
    
    // 初始化节点
    graphNodes.forEach(node => {
      node.value = 0
      node.sourceLinks = []
      node.targetLinks = []
    })

    // 处理连接
    graphLinks.forEach(link => {
      link.source = typeof link.source === 'number' ? graphNodes[link.source] : link.source
      link.target = typeof link.target === 'number' ? graphNodes[link.target] : link.target
      link.source.sourceLinks.push(link)
      link.target.targetLinks.push(link)
      link.source.value += link.value
      link.target.value += link.value
    })

    // 计算节点层级和高度
    computeNodeDepths(graphNodes)
    computeNodeHeights(graphNodes)
    computeNodeBreadths(graphNodes, nodeAlign)
    computeLinkBreadths(graphNodes)

    return { nodes: graphNodes, links: graphLinks }
  }

  // 计算节点深度
  const computeNodeDepths = (nodes) => {
    const visited = new Set()
    const queue = []
    
    // 找到源节点（没有入边的节点）
    nodes.forEach(node => {
      if (node.targetLinks.length === 0) {
        queue.push({ node, depth: 0 })
        visited.add(node)
      }
    })

    while (queue.length > 0) {
      const { node, depth } = queue.shift()
      node.depth = Math.max(node.depth || 0, depth)
      
      node.sourceLinks.forEach(link => {
        if (!visited.has(link.target)) {
          queue.push({ node: link.target, depth: depth + 1 })
          visited.add(link.target)
        }
      })
    }
  }

  // 计算节点高度
  const computeNodeHeights = (nodes) => {
    const visited = new Set()
    const queue = []
    
    // 找到汇节点（没有出边的节点）
    nodes.forEach(node => {
      if (node.sourceLinks.length === 0) {
        queue.push({ node, height: 0 })
        visited.add(node)
      }
    })

    while (queue.length > 0) {
      const { node, height } = queue.shift()
      node.height = Math.max(node.height || 0, height)
      
      node.targetLinks.forEach(link => {
        if (!visited.has(link.source)) {
          queue.push({ node: link.source, height: height + 1 })
          visited.add(link.source)
        }
      })
    }
  }

  // 计算节点宽度位置
  const computeNodeBreadths = (nodes, align) => {
    const depthGroups = {}
    nodes.forEach(node => {
      if (!depthGroups[node.depth]) {
        depthGroups[node.depth] = []
      }
      depthGroups[node.depth].push(node)
    })

    const depths = Object.keys(depthGroups).map(Number).sort((a, b) => a - b)
    const width = extent[1][0] - extent[0][0]
    const dx = (width - nodeWidth) / Math.max(1, depths.length - 1)

    // 计算每个层级的节点位置
    depths.forEach((depth, i) => {
      const nodesInDepth = depthGroups[depth]
      
      // 应用节点排序
      if (nodeSort) {
        nodesInDepth.sort(nodeSort)
      }
      
      // 计算节点高度
      const totalHeight = nodesInDepth.reduce((sum, node) => sum + node.value, 0)
      const dy = (extent[1][1] - extent[0][1] - (nodesInDepth.length - 1) * nodePadding) / totalHeight
      
      let y0 = extent[0][1]
      nodesInDepth.forEach(node => {
        node.x0 = extent[0][0] + i * dx
        node.x1 = node.x0 + nodeWidth
        node.y0 = y0
        node.y1 = y0 + node.value * dy
        y0 = node.y1 + nodePadding
      })
    })
  }

  // 计算连接线宽度位置
  const computeLinkBreadths = (nodes) => {
    nodes.forEach(node => {
      // 对连接进行排序
      if (linkSort) {
        node.sourceLinks.sort(linkSort)
        node.targetLinks.sort(linkSort)
      }
      
      // 计算源连接的位置
      let y0 = node.y0
      node.sourceLinks.forEach(link => {
        link.y0 = y0 + link.value / 2
        link.width = link.value // 添加宽度计算
        y0 += link.value
      })
      
      // 计算目标连接的位置
      y0 = node.y0
      node.targetLinks.forEach(link => {
        link.y1 = y0 + link.value / 2
        if (!link.width) {
          link.width = link.value // 确保宽度被设置
        }
        y0 += link.value
      })
    })
  }

  // API 方法
  sankeyLayout.nodeWidth = (width) => {
    if (width === undefined) return nodeWidth
    nodeWidth = +width
    return sankeyLayout
  }

  sankeyLayout.nodePadding = (padding) => {
    if (padding === undefined) return nodePadding
    nodePadding = +padding
    return sankeyLayout
  }

  sankeyLayout.extent = (ext) => {
    if (ext === undefined) return extent
    extent = ext
    return sankeyLayout
  }

  sankeyLayout.size = (size) => {
    if (size === undefined) return [extent[1][0] - extent[0][0], extent[1][1] - extent[0][1]]
    extent = [[0, 0], size]
    return sankeyLayout
  }

  sankeyLayout.iterations = (iter) => {
    if (iter === undefined) return iterations
    iterations = +iter
    return sankeyLayout
  }

  sankeyLayout.nodeId = (id) => {
    if (id === undefined) return nodeId
    nodeId = id
    return sankeyLayout
  }

  sankeyLayout.nodeAlign = (align) => {
    if (align === undefined) return nodeAlign
    nodeAlign = align
    return sankeyLayout
  }

  sankeyLayout.nodeSort = (sort) => {
    if (sort === undefined) return nodeSort
    nodeSort = sort
    return sankeyLayout
  }

  sankeyLayout.linkSort = (sort) => {
    if (sort === undefined) return linkSort
    linkSort = sort
    return sankeyLayout
  }

  sankeyLayout.nodes = (nodesAccessor) => {
    if (nodesAccessor === undefined) return nodes
    nodes = nodesAccessor
    return sankeyLayout
  }

  sankeyLayout.links = (linksAccessor) => {
    if (linksAccessor === undefined) return links
    links = linksAccessor
    return sankeyLayout
  }

  return sankeyLayout
}

/**
 * 节点对齐方法
 */
export const sankeyLeft = (node, n) => node.depth
export const sankeyRight = (node, n) => n - 1 - node.height
export const sankeyCenter = (node, n) => {
  const incoming = node.targetLinks
  if (incoming.length === 0) return (n - 1) / 2
  return incoming.reduce((sum, d) => sum + d.source.depth, 0) / incoming.length
}
export const sankeyJustify = (node, n) => {
  const outgoing = node.sourceLinks
  if (outgoing.length === 0) return (n - 1) / 2
  return outgoing.reduce((sum, d) => sum + d.target.depth, 0) / outgoing.length
}

/**
 * 水平桑基图连接线生成器
 * 参考 d3.sankeyLinkHorizontal()
 */
export const sankeyLinkHorizontal = () => {
  let source = (d) => [d.source.x1, d.y0]
  let target = (d) => [d.target.x0, d.y1]
  
  const link = (d) => {
    const [x0, y0] = source(d)
    const [x1, y1] = target(d)
    
    // 生成三次贝塞尔曲线路径
    const x2 = x0 + (x1 - x0) * 0.3
    const x3 = x0 + (x1 - x0) * 0.7
    
    return `M${x0},${y0}C${x2},${y0} ${x3},${y1} ${x1},${y1}`
  }
  
  link.source = (x) => {
    if (x === undefined) return source
    source = x
    return link
  }
  
  link.target = (x) => {
    if (x === undefined) return target
    target = x
    return link
  }
  
  return link
}

/**
 * 创建桑基图数据
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 连接数组
 * @returns {Object} 桑基图数据对象
 */
export const createSankeyData = (nodes, links) => {
  return { nodes, links }
}

/**
 * 默认桑基图数据
 */
export const defaultSankeyData = {
  nodes: [
    { name: '节点A' },
    { name: '节点B' },
    { name: '节点C' },
    { name: '节点D' },
    { name: '节点E' }
  ],
  links: [
    { source: 0, target: 1, value: 50 },
    { source: 0, target: 2, value: 30 },
    { source: 0, target: 3, value: 20 },
    { source: 1, target: 4, value: 40 },
    { source: 2, target: 4, value: 20 },
    { source: 3, target: 4, value: 20 }
  ]
}

// 为了兼容性，保留旧的函数名
export const customSankey = sankey
export const customSankeyLinkHorizontal = sankeyLinkHorizontal
