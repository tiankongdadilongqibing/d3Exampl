# D3.js 数据可视化示例项目

这是一个使用 Vue 3 + Vite + D3.js 构建的交互式数据可视化示例项目。

## 功能特性

项目包含以下7种数据可视化组件：

1. **柱状图 (Bar Chart)** - 展示分类数据的比较
2. **折线图 (Line Chart)** - 展示时间序列数据趋势
3. **散点图 (Scatter Plot)** - 展示两个变量之间的关系
4. **饼图 (Pie Chart)** - 展示部分与整体的关系
5. **力导向图 (Force Diagram)** - 展示节点间的关系网络
6. **思维导图 (Mind Map)** - 展示层级结构和交互式配置
7. **桑基图 (Sankey Diagram)** - 展示数据流动和转换

## 技术栈

- **Vue 3** - 前端框架，使用 Composition API
- **Vite** - 构建工具
- **D3.js** - 数据可视化库
- **d3-sankey** - 桑基图专用插件

## 项目结构

```
src/
├── components/
│   ├── BarChart.vue      # 柱状图组件
│   ├── LineChart.vue     # 折线图组件
│   ├── ScatterPlot.vue   # 散点图组件
│   ├── PieChart.vue      # 饼图组件
│   ├── ForceDiagram.vue  # 力导向图组件
│   ├── MindMap.vue       # 思维导图组件
│   └── SankeyChart.vue   # 桑基图组件
├── App.vue               # 主应用组件
└── main.js              # 应用入口
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 特色功能

### 思维导图组件
- 支持多层级数据展示
- 内置动物图标和颜色区分
- 交互式配置面板（复选框、下拉菜单、按钮）
- 响应式状态管理
- 实时调试面板

### 桑基图组件
- 展示数据在不同节点间的流动
- 支持复杂的网络关系可视化
- 自动布局和颜色编码

## 使用说明

1. 打开应用后，使用顶部导航栏切换不同的图表类型
2. 每个图表都支持交互操作（悬停、点击等）
3. 思维导图支持复杂的配置操作
4. 所有图表都是响应式的，支持不同屏幕尺寸

## 开发说明

- 所有D3.js逻辑都封装在Vue组件中
- 使用`onMounted`生命周期钩子初始化图表
- 使用`onUnmounted`清理资源
- 支持Vue的响应式数据绑定

## 许可证

MIT License 