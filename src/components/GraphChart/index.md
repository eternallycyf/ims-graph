---
title: GraphChart
description: GraphChart
toc: content
group:
  title: 图谱
  order: 0
demo:
  cols: 2
---

<code transform="true" src='./demo/index.tsx'>GraphChart</code>

## interface

```ts
export interface IGraphDataRecord {
  title: string;
  content?: string;
  keyPersonName?: string;
  children?: IGraphDataRecord[];
}

export interface IGraphChartProps {
  chartType: '1' | '2';
  data: IGraphDataRecord[];
}
```
